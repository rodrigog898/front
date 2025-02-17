import { useEffect, useRef, useState, useCallback } from 'react';

interface SpeechRecognitionOptions {
  continuous?: boolean;
  language?: string;
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
  isSupported: boolean;
  isMicrophoneAvailable: boolean;
}

export const useSpeechRecognition = (
  options: SpeechRecognitionOptions = {},
  onResult?: (result: string) => void,
  onError?: (error: string) => void
): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(true);
  
  const recognition = useRef<any>(null);

  // Inicializar el reconocimiento de voz
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Verificar soporte del navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    recognition.current = new SpeechRecognition();

    // Configurar opciones
    recognition.current.continuous = options.continuous ?? true;
    recognition.current.interimResults = options.interimResults ?? true;
    recognition.current.lang = options.language ?? 'es-ES';

    // Manejar resultados
    recognition.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      if (onResult) onResult(currentTranscript);
    };

    // Manejar errores
    recognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event);
      
      if (event.error === 'not-allowed') {
        setIsMicrophoneAvailable(false);
        setError('Microphone access was denied. Please allow microphone access to use speech recognition.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
      if (onError) onError(event.error);
    };

    // Manejar fin del reconocimiento
    recognition.current.onend = () => {
      setIsListening(false);
      // Si está configurado como continuo, reiniciar automáticamente
      if (options.continuous && !error) {
        startListening();
      }
    };

  }, [options.continuous, options.interimResults, options.language, onResult, onError, error]);

  // Inicializar al montar
  useEffect(() => {
    initRecognition();
    return () => {
      if (recognition.current) {
        recognition.current.abort();
      }
    };
  }, [initRecognition]);

  const startListening = async () => {
    try {
      if (!recognition.current) {
        initRecognition();
      }

      // Verificar permisos del micrófono
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permission.state === 'denied') {
        setIsMicrophoneAvailable(false);
        throw new Error('Microphone permission denied');
      }

      // Intentar iniciar el reconocimiento
      await recognition.current.start();
      setIsListening(true);
      setError(null);
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(err.message || 'Error starting speech recognition');
      setIsListening(false);
      if (onError) onError(err.message);
    }
  };

  const stopListening = useCallback(() => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isSupported,
    isMicrophoneAvailable
  };
}; 