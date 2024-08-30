"use client";

import { MessagesContext } from "@/context/messages";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpCircleIcon, CornerDownLeft, Loader2, StopCircleIcon } from "lucide-react";
import { FC, HTMLAttributes, useContext, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { Message } from "@/utils/types";
import { cn } from "@/lib/utils";
import { WithToolTip } from "../ui/WithToolTip";

interface ChatbotInputProps extends HTMLAttributes<HTMLDivElement> { }

const ChatbotInput: FC<ChatbotInputProps> = ({ className }) => {
  const { handlePromptResponse, isLoading, isError, textareaRef } =
    useContext(MessagesContext);

  if (isError) {
    toast({
      className: cn(
        'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4'
      ),
      title: "Something went wrong",
      description: "There was an error generating a response, please try again.",
      variant: "destructive",
    });
  }

  return (
    <div className="px-4 pb-3">
      <div className="border-t border-border">
        <div className="relative mt-4 flex-1 overflow-hidden rounded-lg border-none outline-none">
          <TextareaAutosize
            ref={textareaRef}
            disabled={isLoading}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                const message: Message = {
                  _id: crypto.randomUUID(),
                  isUserMessage: true,
                  text: textareaRef.current.value
                };
                await handlePromptResponse(message);
                textareaRef.current.value = ""
              }
            }}
            rows={2}
            maxRows={4}
            onChange={(e) => textareaRef.current.value = e.target.value}
            placeholder="Ask me anything..."
            className="peer disabled:opacity-50 pl-2 pr-14 resize-none block w-full border-0 bg-transparent py-1.5 text-primary focus:ring-0 text-sm sm:leading-6 focus:outline-none placeholder-muted-foreground"
          />
          <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
            <div className="inline-flex items-center px-1 font-sans text-muted-foreground">
              {
                isLoading
                  ?
                  <WithToolTip
                    component={<StopCircleIcon className="w-7 h-7 rounded-full cursor-pointer" />}
                    text="Stop Query"
                  />
                  :
                  <WithToolTip
                    component={
                      <ArrowUpCircleIcon
                        className="w-7 h-7 rounded-full cursor-pointer"
                        onClick={async () => {
                          const message: Message = {
                            _id: crypto.randomUUID(),
                            isUserMessage: true,
                            text: textareaRef.current.value
                          };
                          await handlePromptResponse(message);
                          textareaRef.current.value = ""

                        }}
                      />
                    }
                    text="Send"
                  />

              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatbotInput;
