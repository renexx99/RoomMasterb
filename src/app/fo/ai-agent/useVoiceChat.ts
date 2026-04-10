// src/app/fo/ai-agent/useVoiceChat.ts
'use client';

import { useState, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'recording' | 'processing';

interface UseVoiceChatReturn {
  /** Current voice recording state */
  voiceState: VoiceState;
  /** Start recording audio from microphone */
  startRecording: () => Promise<void>;
  /** Stop recording and send audio for transcription */
  stopRecording: () => void;
  /** Toggle recording on/off */
  toggleRecording: () => void;
  /** Error message if any */
  voiceError: string | null;
  /** Clear current error */
  clearVoiceError: () => void;
}

interface UseVoiceChatOptions {
  /** Callback when transcription is successfully received */
  onTranscript: (transcript: string) => void;
  /** Optional callback when an error occurs */
  onError?: (error: string) => void;
}

export function useVoiceChat({ onTranscript, onError }: UseVoiceChatOptions): UseVoiceChatReturn {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
  }, []);

  const cleanup = useCallback(() => {
    // Stop all tracks on the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  const sendAudioForTranscription = useCallback(async (audioBlob: Blob) => {
    setVoiceState('processing');
    
    try {
      const formData = new FormData();
      // Whisper accepts webm, mp4, mp3, wav, etc.
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/ai/voice', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || 'Gagal memproses suara.';
        setVoiceError(errorMsg);
        onError?.(errorMsg);
        return;
      }
      
      if (data.transcript) {
        onTranscript(data.transcript);
      }
    } catch (err: any) {
      const errorMsg = 'Gagal menghubungkan ke server voice.';
      setVoiceError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setVoiceState('idle');
    }
  }, [onTranscript, onError]);

  const startRecording = useCallback(async () => {
    setVoiceError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Prefer webm/opus for best Whisper compatibility, fallback to other codecs
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        cleanup();
        
        // Only send if we have meaningful audio (> 1KB to avoid empty recordings)
        if (audioBlob.size > 1000) {
          sendAudioForTranscription(audioBlob);
        } else {
          setVoiceState('idle');
          const errorMsg = 'Rekaman terlalu pendek. Silakan coba lagi.';
          setVoiceError(errorMsg);
          onError?.(errorMsg);
        }
      };
      
      mediaRecorder.onerror = () => {
        cleanup();
        setVoiceState('idle');
        const errorMsg = 'Terjadi kesalahan saat merekam.';
        setVoiceError(errorMsg);
        onError?.(errorMsg);
      };
      
      mediaRecorder.start(250); // Collect data every 250ms
      setVoiceState('recording');
      
    } catch (err: any) {
      cleanup();
      setVoiceState('idle');
      
      let errorMsg = 'Tidak bisa mengakses mikrofon.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Akses mikrofon ditolak. Silakan izinkan akses mikrofon di browser.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'Mikrofon tidak ditemukan. Pastikan perangkat mikrofon terhubung.';
      }
      
      setVoiceError(errorMsg);
      onError?.(errorMsg);
    }
  }, [cleanup, sendAudioForTranscription, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (voiceState === 'recording') {
      stopRecording();
    } else if (voiceState === 'idle') {
      startRecording();
    }
    // If 'processing', do nothing — wait for transcription
  }, [voiceState, startRecording, stopRecording]);

  return {
    voiceState,
    startRecording,
    stopRecording,
    toggleRecording,
    voiceError,
    clearVoiceError,
  };
}
