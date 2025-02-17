import React, { useEffect, useState } from 'react'
import { Dialog as DialogUI, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface DeviceInfo {
  deviceId: string;
  label: string;
}

interface InterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDevicesSelected: (devices: { cameraId: string; microphoneId: string }) => void;
  isLoading: boolean;
  error: string | null;
  welcomeMessage?: string;
}

export function InterviewDialog({
  open,
  onOpenChange,
  onDevicesSelected,
  isLoading,
  error,
  welcomeMessage
}: InterviewDialogProps) {
  const [cameraDevices, setCameraDevices] = useState<DeviceInfo[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (open) {
      requestPermissions();
    }
  }, [open]);

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      await getDevices();
    } catch (err) {
      console.error('Error requesting permissions:', err);
      setCameraError('Failed to get camera and microphone permissions. Please allow access and try again.');
    }
  };

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      setCameraDevices(cameras.map(camera => ({ deviceId: camera.deviceId, label: camera.label })));
      setMicrophoneDevices(microphones.map(mic => ({ deviceId: mic.deviceId, label: mic.label })));
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (microphones.length > 0) setSelectedMicrophone(microphones[0].deviceId);
    } catch (err) {
      console.error('Error getting devices:', err);
      setCameraError('Failed to get camera and microphone devices. Please check your permissions.');
    }
  };

  const initializeCamera = async () => {
    if (!selectedCamera) {
      console.error('No camera selected');
      setCameraError('No camera selected. Please choose a camera from the list.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCamera } },
        audio: false
      });

      // We're just testing if we can get the stream, then stopping it immediately
      stream.getTracks().forEach(track => track.stop());
      setIsCameraReady(true);
      setCameraError(null);
    } catch (err) {
      console.error('Error initializing camera:', err);
      let errorMessage = 'Failed to initialize camera. ';
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotFoundError':
            errorMessage += 'Camera not found. Please ensure your camera is connected and not in use by another application.';
            break;
          case 'NotAllowedError':
            errorMessage += 'Camera access denied. Please grant permission to use the camera.';
            break;
          case 'NotReadableError':
            errorMessage += 'Could not start video source. Please try closing other applications that might be using the camera.';
            break;
          default:
            errorMessage += 'Please check your camera permissions and try again.';
        }
      }
      setCameraError(errorMessage);
      setIsCameraReady(false);
    }
  };

  useEffect(() => {
    if (selectedCamera) {
      initializeCamera();
    }
  }, [selectedCamera]);

  const handleStartInterview = () => {
    onDevicesSelected({ 
      cameraId: selectedCamera, 
      microphoneId: selectedMicrophone,
      allowExpressions: isChecked
    });
  };

  return (
    <DialogUI open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Interview?</DialogTitle>
          {welcomeMessage && (
            <DialogDescription className="mt-4 text-lg">
              {welcomeMessage}
            </DialogDescription>
          )}
        </DialogHeader>
        <p>Are you ready to begin your AI-powered interview experience?</p>
        <div className="space-y-4">
          {cameraDevices.length > 0 && (
            <div>
              <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700">Camera</label>
              <Select onValueChange={setSelectedCamera} value={selectedCamera}>
                <SelectTrigger id="camera-select">
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {cameraDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.substr(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {microphoneDevices.length > 0 && (
            <div>
              <label htmlFor="microphone-select" className="block text-sm font-medium text-gray-700">Microphone</label>
              <Select onValueChange={setSelectedMicrophone} value={selectedMicrophone}>
                <SelectTrigger id="microphone-select">
                  <SelectValue placeholder="Select a microphone" />
                </SelectTrigger>
                <SelectContent>
                  {microphoneDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.substr(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            onClick={handleStartInterview}
            className="w-full bg-black text-white hover:bg-gray-800"
            disabled={!isCameraReady || !!cameraError}
          >
            {isCameraReady ? 'Begin Interview' : 'Initializing Camera...'}
          </Button>
          {cameraError && (
            <p className="text-red-500 text-sm">{cameraError}</p>
          )}
          <div className="bg-black p-4 rounded-md w-full" hidden={!isCameraReady || !!cameraError}>
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                id="expression-permission"
                checked={isChecked}
                onCheckedChange={(checked) => setIsChecked(checked as boolean)}
                className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out"
              />
              <span className="text-gray-300 text-sm font-medium">
                Permitir leer mis expresiones
              </span>
            </label>
          </div>
        </div>
      </DialogContent>
    </DialogUI>
  );
}