import { forwardRef } from 'react'

type AvatarVideoProps = {
  avatarStream: MediaStream | null;
}

const AvatarVideo = forwardRef<HTMLVideoElement, AvatarVideoProps>((props, ref) => {
  return <div className="w-full h-full flex items-center justify-center">
    {props.avatarStream ? (
      <video
        ref={ref}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
      >
        Your browser does not support the video tag.
      </video>
    ) : (
      <p>Waiting for avatar stream...</p>
    )}
  </div>
})

AvatarVideo.displayName = 'AvatarVideo'

export default AvatarVideo
