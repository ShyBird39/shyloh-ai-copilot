import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  error: string | null;
  mimeType: string;
  fileExtension: string;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  const [fileExtension, setFileExtension] = useState<string>('webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick best supported MIME type per-platform
      const candidates = [
        'audio/mp4;codecs=aac',
        'audio/mp4',
        'audio/aac',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];
      let selected: string | undefined;
      if (typeof (window as any).MediaRecorder?.isTypeSupported === 'function') {
        for (const t of candidates) {
          try {
            if ((window as any).MediaRecorder.isTypeSupported(t)) {
              selected = t;
              break;
            }
          } catch (_e) {
            // ignore
          }
        }
      }

      const options = selected ? { mimeType: selected } : undefined as any;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Persist the actual mimeType used by the recorder
      const actualType = mediaRecorder.mimeType || selected || 'audio/webm';
      setMimeType(actualType);
      const ext = actualType.startsWith('audio/mp4') ? 'm4a'
        : actualType === 'audio/aac' ? 'aac'
        : actualType === 'audio/mpeg' ? 'mp3'
        : 'webm';
      setFileExtension(ext);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blobType = mediaRecorder.mimeType || actualType;
        const blob = new Blob(audioChunksRef.current, { type: blobType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error,
    mimeType,
    fileExtension,
  };
};
