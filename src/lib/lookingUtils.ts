import * as faceapi from 'face-api.js'

export const isLookingStraight = (landmarks: faceapi.FaceLandmarks68) => {
  const leftEye  = landmarks.getLeftEye()
  const rightEye = landmarks.getRightEye()
  const nose     = landmarks.getNose()

  const eyeYDifference = Math.abs(leftEye[0].y - rightEye[0].y)

  const averageEyeX = (leftEye[0].x + rightEye[0].x) / 2

  const noseXDeviation = Math.abs(nose[0].x - averageEyeX)

  const eyeYThreshold  = 20
  const noseXThreshold = 35

  const eyesAligned  = eyeYDifference < eyeYThreshold
  const noseCentered = noseXDeviation < noseXThreshold

  console.log(eyesAligned);
  console.log(noseCentered);

  return eyesAligned && noseCentered
}