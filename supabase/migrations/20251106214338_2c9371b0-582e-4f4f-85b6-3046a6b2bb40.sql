-- Add synthesis workflow columns to voice_memos
ALTER TABLE voice_memos 
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'reviewed', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewer_notes text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS used_in_draft boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS draft_id uuid;

-- Create draft_narratives table for synthesized logs
CREATE TABLE IF NOT EXISTS draft_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id text NOT NULL,
  shift_date date NOT NULL,
  shift_type text NOT NULL,
  narrative text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published')),
  source_memo_ids uuid[] DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on draft_narratives
ALTER TABLE draft_narratives ENABLE ROW LEVEL SECURITY;

-- Restaurant members can view draft narratives
CREATE POLICY "Restaurant members can view draft narratives"
ON draft_narratives FOR SELECT
USING (is_restaurant_member(auth.uid(), restaurant_id));

-- Restaurant members can create draft narratives
CREATE POLICY "Restaurant members can create draft narratives"
ON draft_narratives FOR INSERT
WITH CHECK (is_restaurant_member(auth.uid(), restaurant_id));

-- Restaurant members can update draft narratives
CREATE POLICY "Restaurant members can update draft narratives"
ON draft_narratives FOR UPDATE
USING (is_restaurant_member(auth.uid(), restaurant_id));

-- Restaurant members can delete draft narratives
CREATE POLICY "Restaurant members can delete draft narratives"
ON draft_narratives FOR DELETE
USING (is_restaurant_member(auth.uid(), restaurant_id));

-- Add foreign key for draft_id (optional, for linking memos to drafts)
ALTER TABLE voice_memos
ADD CONSTRAINT fk_draft_narratives
FOREIGN KEY (draft_id) REFERENCES draft_narratives(id) ON DELETE SET NULL;