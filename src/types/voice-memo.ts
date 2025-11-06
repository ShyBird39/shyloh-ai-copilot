export interface VoiceMemo {
  id: string;
  user_id: string;
  restaurant_id: string;
  audio_url: string;
  duration_seconds: number;
  transcription: string | null;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  shift_date: string;
  shift_type: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  review_status?: 'unreviewed' | 'reviewed' | 'approved' | 'rejected';
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  used_in_draft?: boolean;
  draft_id?: string | null;
}

export interface DraftNarrative {
  id: string;
  restaurant_id: string;
  shift_date: string;
  shift_type: string;
  narrative: string;
  status: 'draft' | 'reviewed' | 'published';
  source_memo_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export type MemoFilter = 'all' | 'unreviewed' | 'reviewed' | 'transcribed' | 'pending';
export type MemoSort = 'newest' | 'oldest' | 'duration';
