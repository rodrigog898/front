import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Video, Settings, MessageSquare, Share2, MonitorUp, Wifi, Clock, Send, MicOff } from 'lucide-react'
import * as faceapi from 'face-api.js'
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TopBar } from './TopBar'
import { ControlBar } from './ControlBar'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useMediaStream } from '@/hooks/useMediaStream'
import { useAvatarSession } from '@/hooks/useAvatarSession'
import { useInterviewChat } from '@/hooks/useInterviewChat'

interface Message {
  type: 'user' | 'assistant';
  text: string;
  time: string;
}

interface VideoCallProps {
  streamingToken: string;
  cameraId: string;
  microphoneId: string;
  onEndInterview: () => void;
  isAllowSave: boolean;
  username: string;
  interviewData: {
    interviewId: string;
    questions: Array<{
      idPregunta: string;
      pregunta: string;
    }>;
    interviewDetails: {
      descripcionVacante: string;
      empresa: string;
      perfilEmpresa: string;
      candidateName?: string;
    };
  };
}


export const VideoCall: React.FC<VideoCallProps> = ({
  streamingToken,
  cameraId,
  microphoneId,
  onEndInterview,
  isAllowSave,
  username,
  interviewData
}) => {
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  
  // Nuevo estado para manejar el texto del usuario
  const [userInput, setUserInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
    isSupported,
    isMicrophoneAvailable
  } = useSpeechRecognition(
    {
      continuous: true,
      language: 'es-ES',
      interimResults: true
    },
    (result) => {
      // Actualizar directamente el input con el resultado
      setUserInput(result);
    },
    (error) => {
      console.error('Speech recognition error:', error);
    }
  );

  // Hooks de medios y avatar
  const { userStream: mediaStreamUserStream, peerConnection: mediaPeerConnection, error: mediaError, 
    isPermissionsGranted: mediaIsPermissionsGranted, initializeMedia, cleanup } =
    useMediaStream(cameraId, microphoneId);
  const { sessionData: avatarSessionData, avatarStream: avatarSessionStream, error: avatarError, isAvatarReady, initializeAvatar, stopAvatar } =
    useAvatarSession(streamingToken);

  // Hook para la lógica de la entrevista y chat
  const { messages: interviewChatMessages, isProcessing: interviewChatIsProcessing, 
    processUserResponse: interviewChatProcessUserResponse, interviewFinished: interviewChatInterviewFinished } = useInterviewChat(
    interviewData,
    avatarSessionData,
    streamingToken
  );

  useEffect(() => {
    checkPermissions();
  }, [cameraId, microphoneId]);

  // NEW: Once media permissions are granted, start the avatar session.
  useEffect(() => {
    if (mediaIsPermissionsGranted) {
      initializeAvatar();
    }
  }, [mediaIsPermissionsGranted, initializeAvatar]);

  useEffect(() => {
    const initInterview = async () => {
      try {
        setInterviewId(interviewData.interviewId);
        
        // Verificar si hay mensajes previos
        if (interviewChatMessages.length === 0) {
          // Si no hay mensajes, generar introducción
          const response = await fetch('http://localhost:3001/api/chats/v1/generate-intro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidateName: interviewData.interviewDetails.candidateName || "Candidato",
              jobTitle: interviewData.interviewDetails.perfilEmpresa,
              companyName: interviewData.interviewDetails.empresa
            })
          });

          const data = await response.json();
          interviewChatProcessUserResponse(data.response);
          await speakQuestion(data.response);
        } else {
          // Si hay mensajes, continuar con la última pregunta
          const lastMessage = interviewChatMessages[interviewChatMessages.length - 1];
          await speakQuestion(`Continuemos con tu entrevista. La última pregunta que te hice fue: ${lastMessage.text}`);
        }
      } catch (error) {
        console.error('Error initializing interview:', error);
      }
    };

    if (avatarSessionData?.sessionId) {
      initInterview();
    }
  }, [avatarSessionData?.sessionId, interviewData]);

  const checkPermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (result.state === 'granted') {
        await initializeMedia();
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        stream.getTracks().forEach(track => track.stop());
        await initializeMedia();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCameraError('Please grant camera and microphone permissions to continue.');
    }
  };

  const retryCamera = async () => {
    setCameraError(null);
    await checkPermissions();
  };

  useEffect(() => {
    if (mediaStreamUserStream && userVideoRef.current) {
      userVideoRef.current.srcObject = mediaStreamUserStream;
    }
  }, [mediaStreamUserStream]);

  useEffect(() => {
    if (avatarSessionStream && avatarVideoRef.current) {
      console.log('Setting avatar video source...');
      avatarVideoRef.current.srcObject = avatarSessionStream;
      
      avatarVideoRef.current.onloadedmetadata = () => {
        console.log('Avatar video metadata loaded');
      };
      
      avatarVideoRef.current.onplay = () => {
        console.log('Avatar video started playing');
      };
      
      avatarVideoRef.current.onerror = (e) => {
        console.error('Avatar video error:', e);
      };
    }
  }, [avatarSessionStream]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, []);

  const endSession = async () => {
    try {
      if (avatarSessionData?.sessionId) {
        await stopAvatar();
        await cleanup();
      }
    } catch (error) {
      console.error('Error ending avatar session:', error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMicrophone = async () => {
    if (mediaStreamUserStream) {
      const audioTrack = mediaStreamUserStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = async () => {
    if (mediaStreamUserStream) {
      const videoTrack = mediaStreamUserStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const addMessage = (type: 'user' | 'assistant', text: string) => {
    const newMessage = {
      type,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    // Implementation of adding a new message to the messages array
  };

  // Función para procesar la respuesta del usuario y obtener la siguiente pregunta
  const processUserResponse = async (userResponse: string) => {
    if (!userResponse.trim() || interviewChatIsProcessing) return;

    interviewChatProcessUserResponse(userResponse);
  };

  // Efecto para ajustar altura del textarea automáticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [userInput]);

  // Manejar cambios en el textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  // Manejar envío de mensaje (actualizado)
  const handleSendMessage = async () => {
    if (isListening) {
      stopListening();
    }
    
    if (!userInput.trim() || interviewChatIsProcessing) return;
    
    await processUserResponse(userInput);
    setUserInput(''); // Limpiar input después de enviar
    resetTranscript(); // Resetear transcripción
  };

  // Manejar tecla Enter (actualizado)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const speakQuestion = async (text: string) => {
    try {
      // Implementation of speaking question logic
    } catch (error) {
      console.error('Error speaking question:', error);
    }
  };

  // Manejar toggle de voz (actualizado)
  const handleVoiceToggle = async () => {
    try {
      if (isListening) {
        stopListening();
        if (transcript.trim()) {
          setUserInput(prev => prev + ' ' + transcript.trim());
          resetTranscript();
        }
      } else {
        if (!isMicrophoneAvailable) {
          return;
        }
        await startListening();
      }
    } catch (error) {
      console.error('Error toggling voice recognition:', error);
    }
  };

  const [isChatVisible, setIsChatVisible] = useState(false);

  return (
    <div className="h-screen bg-gray-900">
      {/* Header simplificado para móvil */}
      <header className="h-16 bg-gray-800 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4">
          <h1 className="text-white font-medium text-sm md:text-base">Frontend Interview</h1>
          <span className="text-red-500 flex items-center text-xs md:text-sm">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse mr-1 md:mr-2" />
            {formatTime(elapsedTime)}
          </span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onEndInterview}
          className="bg-red-500 hover:bg-red-600 text-xs md:text-sm font-medium px-3 py-1.5
            shadow-sm transition-colors duration-200"
        >
          End
        </Button>
      </header>

      <main className="relative h-[calc(100vh-4rem)]">
        {/* Video container con diseño responsive */}
        <div className="relative h-full">
          {/* Avatar video */}
          <div className="relative h-full bg-gray-800">
            {avatarError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <p className="text-red-500 text-sm">Error: {avatarError}</p>
              </div>
            )}
            
            {!isAvatarReady && !avatarError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <p className="text-white text-sm">Initializing interview...</p>
              </div>
            )}

            <video
              ref={avatarVideoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
            />
            
            {/* Interviewer info - más compacto en móvil */}
            <div className="absolute bottom-4 left-4 bg-gray-900/80 px-2 py-1 md:px-3 md:py-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Mic className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
                <span className="text-white text-xs md:text-sm">AI Interviewer</span>
              </div>
            </div>

            {/* User video - adaptable según dispositivo */}
            <div className="absolute top-4 right-4 w-[120px] md:w-[280px] rounded-lg overflow-hidden border-2 border-gray-700">
              {cameraError ? (
                <div className="bg-gray-800 p-2 md:p-4">
                  <p className="text-red-500 text-xs md:text-sm">{cameraError}</p>
                  <Button onClick={retryCamera} variant="outline" size="sm" className="mt-2 text-xs">
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="relative aspect-video">
                  <video
                    ref={userVideoRef}
                    className="h-full w-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/60 px-2 py-1 md:px-3 md:py-2">
                    <span className="text-xs md:text-sm text-white">You</span>
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <Mic className={`h-3 w-3 md:h-4 md:w-4 ${isMicOn ? 'text-green-400' : 'text-red-400'}`} />
                      <Video className={`h-3 w-3 md:h-4 md:w-4 ${isCameraOn ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat/Response panel - Móvil: overlay en la parte inferior */}
          <div className="absolute bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm md:w-[400px] 
            md:absolute md:right-0 md:top-0 md:bottom-0 md:bg-gray-800 md:border-l md:border-gray-700
            pb-[80px] md:pb-4">
            {/* Toggle para mostrar/ocultar chat en móvil */}
            <button 
              className="absolute -top-10 right-4 bg-gray-800 rounded-t-lg px-4 py-2 text-white text-sm md:hidden"
              onClick={() => setIsChatVisible(prev => !prev)}
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <div className={`flex flex-col h-[50vh] md:h-full ${isChatVisible ? 'translate-y-0' : 'translate-y-full'} 
              md:translate-y-0 transition-transform duration-300`}>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {interviewChatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-2 md:p-3 ${
                      message.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'
                    }`}>
                      <p className="text-white text-xs md:text-sm">{message.text}</p>
                      <span className="text-[10px] md:text-xs text-gray-400 mt-1 block">{message.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input area */}
              <div className="p-2 md:p-4 border-t border-gray-700">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={isListening ? 'Listening...' : 'Type your answer...'}
                    className="w-full rounded-lg bg-gray-700 px-3 py-2 md:px-4 md:py-3 pr-[45px] 
                      text-sm md:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                      focus:ring-blue-500 min-h-[60px] md:min-h-[80px] max-h-[150px] md:max-h-[200px] resize-none"
                    disabled={interviewChatIsProcessing}
                    rows={2}
                  />
                  
                  <div className="absolute right-2 bottom-2">
                    <Button
                      onClick={handleSendMessage}
                      disabled={interviewChatIsProcessing || !userInput.trim()}
                      className="h-8 md:h-10 px-3 md:px-4"
                    >
                      <Send className="h-4 w-4 md:h-5 md:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Controls bar - más compacto en móvil */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 
        bg-gray-900/80 backdrop-blur-sm 
        md:left-1/2 md:-translate-x-1/2 md:w-auto md:bg-transparent md:backdrop-blur-0 md:mb-6">
        <div className="flex items-center space-x-3 md:space-x-4 bg-gray-800 rounded-full px-4 py-2 md:px-6 md:py-3
          shadow-lg md:shadow">
          <button
            onClick={toggleMicrophone}
            className={`p-2 md:p-3 rounded-full transition-colors ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <Mic className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>
          <button
            onClick={toggleCamera}
            className={`p-2 md:p-3 rounded-full transition-colors ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            <Video className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};