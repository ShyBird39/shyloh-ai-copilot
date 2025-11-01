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
}

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
