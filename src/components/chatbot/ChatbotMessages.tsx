"use client"
import { FC, useContext } from "react";
import { MessagesContext } from "@/context/messages";
import { cn } from "@/lib/utils";
import ChatbotMessage from "./ChatbotMessage";
import { SyncLoader } from "react-spinners"
import uuid from "react-uuid";

const ChatbotMessages: FC<{ className: string }> = ({ className }) => {
  const { messages, isLoading, isServingResponse, isFetchingMessages, messagesContainerRef } = useContext(MessagesContext);
  const inverseMessages = [...messages];

  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 overflow-auto scrollbar-thumb-border scrollbar-thumb-rounded scrollbar-track-transparent scrollbar scrollbar-width chat-container",
        className
      )}
    >
      <div className="flex-1 flex-grow" ref={messagesContainerRef} />
      {isFetchingMessages ? (
        <div className="flex justify-center items-center h-full">
          <SyncLoader size={8} />
        </div>
      ) : (
        <>
          {(isLoading && !isServingResponse) && <SyncLoader size={8} />}
          {inverseMessages.map((message) => (
            <ChatbotMessage message={message} key={uuid()} />
          ))}
        </>
      )}
    </div>
  );
};

export default ChatbotMessages;