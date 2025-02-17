import React from 'react';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Avatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url: string;
}

interface InterviewerListProps {
  avatars: Avatar[];
  onSelectAvatar: (avatar: Avatar) => void;
}

export const InterviewerList: React.FC<InterviewerListProps> = ({ avatars, onSelectAvatar }) => {
  return (
    <Card className="flex-grow overflow-hidden">
      <CardContent className="p-6 h-full">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {avatars.map((avatar) => (
              <Card key={avatar.avatar_id} className="flex flex-col">
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <Avatar className="w-32 h-32 mx-auto mb-4">
                      <AvatarImage src={avatar.preview_image_url} alt={avatar.avatar_name} />
                      <AvatarFallback>{avatar.avatar_name[0]}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-semibold text-center mb-4">{avatar.avatar_name}</h2>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => onSelectAvatar(avatar)}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};