export type { VoiceMemo, DraftNarrative } from './voice-memo';

export interface LogDraft {
  id: string;
  restaurant_id: string;
  shift_date: string;
  shift_type: string;
  narrative: string;
  status: 'draft' | 'reviewed' | 'approved';
  source_memos: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}
