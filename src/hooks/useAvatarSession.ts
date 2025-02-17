import { useEffect, useRef, useState } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion
} from '@heygen/streaming-avatar';

interface AvatarSessionState {
  stream?: MediaStream;
  error?: string;
  isReady: boolean;
}

export function useAvatarSession(token: string) {
  const [state, setState] = useState<AvatarSessionState>({
    isReady: false
  });
  const avatar = useRef<StreamingAvatar | null>(null);
  const mediaStreamRef = useRef<HTMLVideoElement | null>(null);

  const initializeAvatar = async () => {
    try {
      // Crear nueva instancia del avatar
      avatar.current = new StreamingAvatar({
        token
      });

      // Configurar event listeners
      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        console.log("Avatar started talking", e);
      });

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        console.log("Avatar stopped talking", e);
      });

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log("Stream disconnected");
        setState(prev => ({ ...prev, isReady: false, error: 'Stream disconnected' }));
      });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        console.log("Stream ready:", event.detail);
        setState(prev => ({
          ...prev,
          stream: event.detail,
          isReady: true
        }));
      });

      // Iniciar sesión del avatar
      const response = await avatar.current.createStartAvatar({
        quality: AvatarQuality.Low,
        avatarName: "josh_lite3_20230714",
        voice: {
          rate: 1.0,
          emotion: VoiceEmotion.NEUTRAL
        },
        language: 'es',
        disableIdleTimeout: true
      });

      // Iniciar chat de voz
      await avatar.current.startVoiceChat({
        useSilencePrompt: false
      });

    } catch (err) {
      console.error('Error initializing avatar:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to initialize avatar',
        isReady: false
      }));
    }
  };

  const speakText = async (text: string) => {
    if (!avatar.current || !state.isReady) {
      console.error('Avatar not initialized');
      return;
    }

    try {
      await avatar.current.speak({ 
        text,
        taskType: 'NORMAL'
      });
    } catch (err) {
      console.error('Error in speak:', err);
    }
  };

  const stopAvatar = async () => {
    if (avatar.current) {
      try {
        await avatar.current.stopAvatar();
        setState({
          isReady: false
        });
      } catch (err) {
        console.error('Error stopping avatar:', err);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopAvatar();
    };
  }, []);

  return {
    stream: state.stream,
    error: state.error,
    isReady: state.isReady,
    initializeAvatar,
    speakText,
    stopAvatar
  };
}