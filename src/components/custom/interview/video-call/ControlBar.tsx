import { Mic, Video, Settings } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";

interface ControlBarProps {
  isMicOn: boolean;
  isCameraOn: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndInterview: () => void;
}


export function ControlBar({ isMicOn, isCameraOn, onToggleMic, onToggleCamera, onEndInterview }: ControlBarProps) {
  return (
    <div className="flex h-24 items-center justify-center border-t border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Control de Micrófono */}
          <button
            onClick={onToggleMic}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-200",
              isMicOn 
                ? "border-white/80 bg-white/10 text-white hover:bg-white/20" 
                : "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            )}
          >
            <Mic className="h-6 w-6" />
          </button>

          {/* Control de Cámara */}
          <button
            onClick={onToggleCamera}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-200",
              isCameraOn 
                ? "border-white/80 bg-white/10 text-white hover:bg-white/20" 
                : "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20"
            )}
          >
            <Video className="h-6 w-6" />
          </button>
        </div>

        <Separator orientation="vertical" className="h-10 bg-gray-700" />

        <div className="flex items-center gap-3">

        <Button 
          variant="destructive" 
          size="lg" 
          className="bg-red-600 hover:bg-red-700 text-white font-medium"
          onClick={onEndInterview}
        >
          End Interview
        </Button>

          <button
            className="flex h-12 items-center gap-2 rounded-md bg-gray-800 px-4 text-white transition-colors hover:bg-gray-700"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
} 