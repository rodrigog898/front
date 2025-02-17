'use client';

import { useState, useEffect } from 'react';
import { VideoCall } from '@/components/custom/interview/video-call/videoCall';
import { InterviewDialog } from '@/components/custom/interview/video-call/dialog';

export default function InterviewPage() {
  const [showDialog, setShowDialog] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. Obtener token de Heygen
        const tokenResponse = await fetch("/api/get-access-token", {
          method: "POST",
        });
        const tokenData = await tokenResponse.text();
        setToken(tokenData);

        // 2. Cargar datos de la entrevista
        const username = "jamilton.quintero@api-ux.com";
        // ... resto de la carga de datos ...

      } catch (err: any) {
        console.error('Error initializing:', err);
        setError(err.message || 'Error initializing interview');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  if (!token || isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
        />
      ) : (
        <VideoCall
          token={token}
          cameraId={selectedDevices.cameraId}
          microphoneId={selectedDevices.microphoneId}
          onEndInterview={() => setShowDialog(true)}
          interviewData={interviewData}
        />
      )}
    </>
  );
}