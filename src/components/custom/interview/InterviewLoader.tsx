import { useEffect, useState } from 'react';
import { interviewService } from '@/services/interview/interviewService';
import { VideoCall } from './video-call/videoCall';
import { Loader2 } from "lucide-react"

interface InterviewLoaderProps {
  username: string;
  streamingToken: string;
  cameraId: string;
  microphoneId: string;
  onEndInterview: () => void;
  isAllowSave: boolean;
}

export const InterviewLoader: React.FC<InterviewLoaderProps> = ({
  username,
  streamingToken,
  cameraId,
  microphoneId,
  onEndInterview,
  isAllowSave
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<any>(null);

  useEffect(() => {
    const initializeInterview = async () => {
      try {
        const data = await interviewService.initializeInterview(username);
        setInterviewData(data);
      } catch (err) {
        setError(err.message || 'Error al inicializar la entrevista');
      } finally {
        setIsLoading(false);
      }
    };

    initializeInterview();
  }, [username]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-white">Preparando la entrevista...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="rounded-full bg-red-100 p-3 text-red-600 mx-auto w-fit">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="mt-4 text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <VideoCall
      streamingToken={streamingToken}
      cameraId={cameraId}
      microphoneId={microphoneId}
      onEndInterview={onEndInterview}
      isAllowSave={isAllowSave}
      username={username}
      interviewData={interviewData}
    />
  );
}; 