import { useState, useCallback } from 'react';

export function useMediaStream(cameraId: string, microphoneId: string) {
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState<boolean>(false);

  const initializeMedia = useCallback(async () => {
    try {
      // Verificar y solicitar permisos de la cámara
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (result.state === 'granted') {
        setIsPermissionsGranted(true);
      } else {
        // Solicitar temporalmente el stream para activar permiso
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        tempStream.getTracks().forEach((track) => track.stop());
        setIsPermissionsGranted(true);
      }

      // Obtener stream específico para el dispositivo seleccionado
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: cameraId } },
        audio: { deviceId: { exact: microphoneId } },
      });
      setUserStream(stream);

      // Inicializar conexión WebRTC
      const pc = new RTCPeerConnection();
      setPeerConnection(pc);
    } catch (err: any) {
      console.error('Error in useMediaStream:', err);
      setError(err.message || 'Failed to initialize media stream.');
    }
  }, [cameraId, microphoneId]);

  const cleanup = useCallback(() => {
    if (userStream) {
      userStream.getTracks().forEach((track) => track.stop());
      setUserStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
  }, [userStream, peerConnection]);

  return { userStream, peerConnection, error, isPermissionsGranted, initializeMedia, cleanup };
} 