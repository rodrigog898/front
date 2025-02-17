'use client'

import { useState, useEffect } from 'react'
import { InterviewDialog } from '@/components/custom/interview/video-call/dialog'
import { VideoCall } from '@/components/custom/interview/video-call/videoCall'
import { TokenVideoChatManager } from '@/services/interview/videoChatManager';
const NEXT_PUBLIC_API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;

interface InterviewData {
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
}

interface DeviceSelection {
  cameraId: string;
  microphoneId: string;
  allowExpressions: boolean;
}

export default function InterviewVideoCallPage() {
  const [showDialog, setShowDialog] = useState(true);
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevices, setSelectedDevices] = useState({
    cameraId: 'default',
    microphoneId: 'default'
  });
  const [streamingToken, setStreamingToken] = useState<string | null>(null);

  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        const username = "jamilton.quintero@api-ux.com";
        
        // 1. Obtener el token de streaming usando el servicio existente
        const tokenResponse = await getToken();
        if (!tokenResponse) throw new Error('Failed to get streaming token');
        setStreamingToken(tokenResponse.token);
        
        // 2. Obtener el ID de la entrevista
        const interviewResponse = await fetch(
          `http://localhost:8081/api/orquestador/v1/entrevistadores?username=${username}`
        );
        const { idEntrevista } = await interviewResponse.json();
        
        // 3. Obtener las preguntas de la entrevista
        const questionsResponse = await fetch(
          `http://localhost:8082/api/administrador-entrevista/v1/preguntas/entrevistas/${idEntrevista}`
        );
        const questions = await questionsResponse.json();

        // 4. Obtener los datos de la entrevista actual
        const interviewDetailsResponse = await fetch(
          `http://localhost:8081/api/orquestador/v1/entrevistadores/${idEntrevista}`
        );
        const interviewDetails = await interviewDetailsResponse.json();

        setInterviewData({
          interviewId: idEntrevista,
          questions,
          interviewDetails
        });

      } catch (err: any) {
        console.error('Error loading interview data:', err);
        setError(err.message || 'Error al cargar los datos de la entrevista');
      } finally {
        setIsLoading(false);
      }
    };

    loadInterviewData();
  }, []);

  const handleStartInterview = (devices: DeviceSelection) => {
    setSelectedDevices(devices);
    setShowDialog(false);
  };


  const getToken = async (): Promise<TokenVideoChatManager> => {
    if (!NEXT_PUBLIC_API_TOKEN) {
      throw new Error("API token is not defined")
    }

    try {
      const response = await fetch(
        "https://api.heygen.com/v1/streaming.create_token",
        {
          method: "POST",
          headers: {
            "x-api-key": NEXT_PUBLIC_API_TOKEN,
            "content-type": "application/json",
          },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      const data = await response.json()

      return {token: data.data.token}
    } catch (error: any) {
      console.error(error)
      return {token: ""}
    }
  }

  const welcomeMessage = interviewData ? 
    `Bienvenido a tu entrevista ${interviewData.interviewDetails.candidateName || ''}. 
     Tenemos ${interviewData.questions.length} preguntas técnicas preparadas para evaluar 
     tu perfil como ${interviewData.interviewDetails.perfilEmpresa} en ${interviewData.interviewDetails.empresa}.` 
    : '';

  if (!streamingToken) {
    return <div>Loading streaming token...</div>;
  }

  return (
    <>
      {showDialog ? (
        <InterviewDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onDevicesSelected={handleStartInterview}
          isLoading={isLoading}
          error={error}
          welcomeMessage={welcomeMessage}
        />
      ) : (
        <VideoCall 
          streamingToken={streamingToken}
          cameraId={selectedDevices.cameraId}
          microphoneId={selectedDevices.microphoneId}
          onEndInterview={() => setShowDialog(true)}
          isAllowSave={true}
          username="jamilton.quintero@api-ux.com"
          interviewData={interviewData}
        />
      )}
    </>
  );
}