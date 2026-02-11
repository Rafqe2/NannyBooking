-- Messaging System
-- Creates conversations and messages tables for two-way messaging
-- tied to confirmed bookings

-- 1) Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  participant_1 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_booking ON public.conversations(booking_id);

-- 2) Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  is_template BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, read_at) WHERE read_at IS NULL;

-- 3) Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies for conversations
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (
    (SELECT auth.uid()) IN (participant_1, participant_2)
  );

CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) IN (participant_1, participant_2)
  );

-- 5) RLS Policies for messages
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (SELECT auth.uid()) IN (c.participant_1, c.participant_2)
    )
  );

CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (SELECT auth.uid()) IN (c.participant_1, c.participant_2)
    )
  );

CREATE POLICY "messages_update_read" ON public.messages
  FOR UPDATE USING (
    sender_id <> (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (SELECT auth.uid()) IN (c.participant_1, c.participant_2)
    )
  );

-- 6) RPC: Get or create conversation for a booking
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
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Check if conversation already exists
  SELECT id INTO v_conv_id FROM public.conversations WHERE booking_id = p_booking_id;
  IF FOUND THEN
    RETURN v_conv_id;
  END IF;

  -- Get booking participants and verify user is participant
  SELECT b.parent_id, b.nanny_id, b.status
  INTO v_parent_id, v_nanny_id, v_status
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking not found';
  END IF;
  IF v_uid <> v_parent_id AND v_uid <> v_nanny_id THEN
    RAISE EXCEPTION 'not a participant';
  END IF;
  IF v_status NOT IN ('confirmed', 'completed') THEN
    RAISE EXCEPTION 'booking must be confirmed or completed';
  END IF;

  -- Create conversation
  INSERT INTO public.conversations (booking_id, participant_1, participant_2)
  VALUES (p_booking_id, v_parent_id, v_nanny_id)
  RETURNING id INTO v_conv_id;

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- 7) RPC: Get unread message count for user
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::INT INTO v_count
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE m.read_at IS NULL
    AND m.sender_id <> v_uid
    AND (c.participant_1 = v_uid OR c.participant_2 = v_uid);

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;

-- 8) RPC: Mark messages as read in a conversation
CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Verify user is participant
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = p_conversation_id
    AND (participant_1 = v_uid OR participant_2 = v_uid)
  ) THEN
    RAISE EXCEPTION 'not a participant';
  END IF;

  -- Mark all unread messages from the other person as read
  UPDATE public.messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id <> v_uid
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;

-- 9) Trigger to update conversations.updated_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();
