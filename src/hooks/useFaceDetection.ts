import { useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement>,
  isAllowed: boolean,
  intervalTime = 300
) {
  const [faceData, setFaceData] = useState<any[]>([]);

  useEffect(() => {
    // Cargar modelos de face-api (se carga una sola vez)
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/weights'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/weights'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/weights'),
        faceapi.nets.faceExpressionNet.loadFromUri('/weights'),
      ]);
    };

    loadModels();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (videoRef.current && isAllowed) {
      interval = setInterval(async () => {
        try {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          if (detections && detections.length > 0) {
            const newFaceData = detections.map((det) => ({ expressions: det.expressions }));
            setFaceData((prev) => [...prev, ...newFaceData]);
          }
        } catch (err) {
          console.error('Error in face detection:', err);
        }
      }, intervalTime);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoRef, isAllowed, intervalTime]);

  return { faceData };
} 