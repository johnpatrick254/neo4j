"use client";
import { cn } from "@/lib/utils";
import { FC, useContext, useState } from "react";
import MarkdownLite from "./MarkdownLite";
import { Message } from "@/utils/types";
import { Button } from "../ui/button";
import { MessagesContext } from "@/context/messages";
import { Edit, Save, X } from "lucide-react";

interface ChatbotMessageProps {
  message: Message;
}

const ChatbotMessage: FC<ChatbotMessageProps> = ({ message }) => {
  const { isLoading, textareaRef } = useContext(MessagesContext);

  const handleEdit = () => {
      textareaRef.current.value = '';
      textareaRef.current.value=message.text
      textareaRef.current.focus()
  };

  

  return (
    <div className="chat-message">
      <div
        className={cn("flex items-end relative mb-5", {
          "justify-end": message.isUserMessage,
        })}
      >
        <div
          className={cn(
            "flex flex-col gap-2 text-sm max-w-[55%]  overflow-x-hidden rounded-t-lg p-3",
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
          {
            message.isUserMessage
            &&
            (
              <div className={`flex gap-2 absolute -bottom-5 right-0 ${isLoading ? "opacity-5":""}`} >
                <Button
                  variant="ghost"
                  disabled={isLoading}
                  type="button"
                  onClick={handleEdit}
                  className="p-0 h-fit"
                >
                  <Edit size={18} color="#000000"
                  />
                </Button>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default ChatbotMessage;