"use client";

import { FC, HTMLAttributes, useContext } from "react";
import { MessagesContext } from "@/context/messages";
import { cn } from "@/lib/utils";
import ChatbotMessage from "./ChatbotMessage";
import { User } from "@/utils/types";


const ChatbotMessages = ({ className }) => {
  const { messages } = useContext(MessagesContext);
  const inverseMessages = [...messages];
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 overflow-auto scrollbar-thumb-border scrollbar-thumb-rounded scrollbar-track-transparent scrollbar scrollbar-w-2",
        className
      )}
    >
      <div className="flex-1 flex-grow" />
      <>
        {inverseMessages.map((message) => (
          <ChatbotMessage
            buttonsActive={true}
            message={message}
            key={message._id}
          />
        ))}
        <ChatbotMessage
          buttonsActive={false}
          message={{
            _id: "default_message_id",
            isUserMessage: false,
            text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`,
          }}
          key={"default_message_id"}
        />
      </>
    </div>
  );
};

export default ChatbotMessages;
