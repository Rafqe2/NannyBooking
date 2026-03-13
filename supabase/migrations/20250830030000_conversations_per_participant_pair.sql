-- Consolidate conversations to one per participant pair.
-- Previously each booking created a new conversation, causing duplicate tabs
-- for the same two users. Now a single conversation is shared across all
-- bookings between the same parent+nanny pair.

-- 1. Add generated columns for canonical participant ordering
--    (so LEAST/GREATEST deduplication works regardless of insertion order)
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS participant_min UUID GENERATED ALWAYS AS (LEAST(participant_1, participant_2)) STORED,
  ADD COLUMN IF NOT EXISTS participant_max UUID GENERATED ALWAYS AS (GREATEST(participant_1, participant_2)) STORED;

-- 2. Deduplicate existing data: keep oldest conversation per participant pair,
--    delete the rest (messages cascade-delete via ON DELETE CASCADE)
DELETE FROM public.conversations
WHERE id NOT IN (
  SELECT DISTINCT ON (
    LEAST(participant_1, participant_2),
    GREATEST(participant_1, participant_2)
  ) id
  FROM public.conversations
  ORDER BY
    LEAST(participant_1, participant_2),
    GREATEST(participant_1, participant_2),
    created_at ASC
);

-- 3. Make booking_id nullable (conversation now outlives any single booking)
ALTER TABLE public.conversations
  ALTER COLUMN booking_id DROP NOT NULL;

-- 4. Drop the old per-booking unique constraint
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_booking_id_key;

-- 5. Add unique constraint on canonical participant pair
ALTER TABLE public.conversations
  ADD CONSTRAINT unique_conversation_participants UNIQUE (participant_min, participant_max);

-- 6. Update get_or_create_conversation to find by participant pair first.
--    When an existing conversation is found, update its booking_id to the
--    latest booking so the conversation list shows up-to-date booking info.
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_booking_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_conv_id uuid;
  v_parent_id uuid;
  v_nanny_id uuid;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- Get booking participants and verify caller is one of them
  SELECT b.parent_id, b.nanny_id, b.status
  INTO v_parent_id, v_nanny_id, v_status
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'booking not found'; END IF;
  IF v_uid <> v_parent_id AND v_uid <> v_nanny_id THEN
    RAISE EXCEPTION 'not a participant';
  END IF;
  IF v_status NOT IN ('confirmed', 'completed') THEN
    RAISE EXCEPTION 'booking must be confirmed or completed';
  END IF;

  -- Find any existing conversation between these two participants
  SELECT id INTO v_conv_id
  FROM public.conversations
  WHERE participant_min = LEAST(v_parent_id, v_nanny_id)
    AND participant_max = GREATEST(v_parent_id, v_nanny_id);

  IF FOUND THEN
    -- Reuse existing conversation; point it at the latest booking so the
    -- conversation list shows the most recent booking date/status
    UPDATE public.conversations
    SET booking_id = p_booking_id, updated_at = NOW()
    WHERE id = v_conv_id;
    RETURN v_conv_id;
  END IF;

  -- No prior conversation — create one
  INSERT INTO public.conversations (booking_id, participant_1, participant_2)
  VALUES (p_booking_id, v_parent_id, v_nanny_id)
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Conversations are now per participant pair — no more duplicate tabs ✅';
END $$;
