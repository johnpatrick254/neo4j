"use client";
import { cn } from "@/lib/utils";
import { FC, useContext } from "react";
import MarkdownLite from "./MarkdownLite";
import { Message } from "@/utils/types";

interface ChatbotMessageProps {
  buttonsActive: boolean;
  message: Message;
}

const ChatbotMessage: FC<ChatbotMessageProps> = ({
  message,
}) => {

  return (
    <div className="chat-message">
      <div
        className={cn("flex items-end", {
          "justify-end": message.isUserMessage,
        })}
      >
        <div
          className={cn(
            "flex flex-col gap-2 text-sm max-w-[90%] overflow-x-hidden rounded-t-lg p-3",
            {
              "bg-foreground text-secondary rounded-l-lg text-right":
                message.isUserMessage,
            },
            {
              "bg-accent text-primary rounded-r-lg text-left":
                !message.isUserMessage,
            }
          )}
        >
          <MarkdownLite text={message.text} />
        </div>
      </div>
    </div>
  );
};

export default ChatbotMessage;
