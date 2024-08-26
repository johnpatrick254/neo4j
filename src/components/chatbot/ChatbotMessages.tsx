"use client";

import { FC, HTMLAttributes, useContext } from "react";
import { MessagesContext } from "@/context/messages";
import { cn } from "@/lib/utils";
import ChatbotMessage from "./ChatbotMessage";
import { SyncLoader } from "react-spinners"
import { User } from "@/utils/types";


const ChatbotMessages = ({ className }) => {
  const { messages, isLoading, isServingResponse, messagesContainerRef } = useContext(MessagesContext);
  const inverseMessages = [...messages];
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 overflow-auto scrollbar-thumb-border scrollbar-thumb-rounded scrollbar-track-transparent scrollbar scrollbar-width chat-container",
        className
      )}
    >
      <div className="flex-1 flex-grow" ref={messagesContainerRef}/>
      <>
       { (isLoading && !isServingResponse) &&  <SyncLoader size={8} />}

        {inverseMessages.map((message) => (
          <ChatbotMessage
            message={message}
            key={message._id}
          />
        ))}
        <ChatbotMessage
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
