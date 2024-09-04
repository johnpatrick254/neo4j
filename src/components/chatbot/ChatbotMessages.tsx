"use client"
import { FC, useContext, useEffect } from "react";
import { MessagesContext } from "@/context/messages";
import { cn } from "@/lib/utils";
import ChatbotMessage from "./ChatbotMessage";
import { SyncLoader } from "react-spinners"
import uuid from "react-uuid";

const ChatbotMessages: FC<{ className: string }> = ({ className }) => {
  const { messages, isLoading, isFetchingMessages, messagesContainerRef } = useContext(MessagesContext);
  const inverseMessages = [...messages];

  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 overflow-auto scrollbar-thumb-border scrollbar-thumb-rounded scrollbar-track-transparent scrollbar scrollbar-width chat-container",
        className
      )}
    >
      <div className="flex-1 flex-grow" />
      <span className="h-5 w-2 flex mx-auto" ref={messagesContainerRef}></span>
      {
        isFetchingMessages
          ?
          (
            <div className="flex justify-center items-center h-full">
              <SyncLoader size={8} />
            </div>
          )
          :
          (
            <>
              {
                (isLoading)
                &&
                <SyncLoader size={8} />
              }
              {
                inverseMessages.map((message) => (
                  <ChatbotMessage message={message} key={uuid()} />
                ))
              }
            </>
          )}
    </div>
  );
};

export default ChatbotMessages;