import { Button } from "@/components/ui/button"
import { Clock, Wifi } from "lucide-react"

interface TopBarProps {
  sessionId?: string;
  elapsedTime: number;
  onEndInterview: () => void;
}

export function TopBar({ sessionId, elapsedTime }: TopBarProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-white">Frontend Developer Interview</span>
          {sessionId && (
            <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
              ID: {sessionId.substring(0, 8)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">

        <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-400">
          <Clock className="h-4 w-4" />
          <time className="text-sm font-medium">{formatTime(elapsedTime)}</time>
        </div>

      </div>
    </header>
  );
} 