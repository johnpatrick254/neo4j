import { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const ChatbotHeader: FC = () => {
  
  return (
    <div className="gap-3 flex justify-start items-center bg-card  px-4 py-3 w-max absolute bottom-24 rounded-full bg-slate-200 right-5">
      <Avatar>
        <AvatarImage src="/assets/fg-coach.jpeg" alt="fg-coach" />
        <AvatarFallback>IB</AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start text-sm">
        <p className="text-xs text-muted-foreground">Chat with</p>
        <div className="flex gap-1.5 items-center">
          <p className="font-medium">imdBot</p>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>
    </div>
  );
};

export default ChatbotHeader;
