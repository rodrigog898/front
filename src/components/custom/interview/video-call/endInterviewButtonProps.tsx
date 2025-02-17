import { Button } from '@/components/ui/button'
import { SquareIcon } from 'lucide-react'

type EndInterviewButtonProps = {
  onClick: () => Promise<void>;
}

export const EndInterviewButton = (props: EndInterviewButtonProps) => {
  return <div className="absolute bottom-4 right-4 space-x-2">
    <Button
      className="bg-black text-white hover:bg-gray-800"
      onClick={props.onClick}
    >
      <SquareIcon className="size-4 mr-2" />
      End Interview
    </Button>
  </div>
}
