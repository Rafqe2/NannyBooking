-- Reports table: allows authenticated users to flag users or ads for admin review.
-- Duplicate reports from the same reporter for the same target are blocked by unique index.

CREATE TABLE IF NOT EXISTS public.reports (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_type text        NOT NULL CHECK (reported_type IN ('user', 'ad')),
  reported_id   uuid        NOT NULL,
  reason        text        NOT NULL,
  note          text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One report per reporter per target (prevents spam)
CREATE UNIQUE INDEX IF NOT EXISTS unique_report_per_reporter
  ON public.reports(reporter_id, reported_type, reported_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can file a report for themselves
CREATE POLICY "authenticated users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Reporters can see their own reports
CREATE POLICY "reporters can view own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Only admins can update status
CREATE POLICY "admins can update report status"
  ON public.reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin'));

DO $$
BEGIN
  RAISE NOTICE 'Reports table created ✅';
END $$;
