"use client";

import { MessagesContext } from "@/context/messages";
import { useMutation } from "@tanstack/react-query";
import { ArrowUpCircleIcon, CornerDownLeft, Loader2, Paperclip, StopCircleIcon } from "lucide-react";
import { FC, HTMLAttributes, useContext, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";
import { Message } from "@/utils/types";
import { cn } from "@/lib/utils";
import { WithToolTip } from "../ui/WithToolTip";
import { Textarea } from "../ui/textarea";

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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };
      textarea.addEventListener('input', adjustHeight);
      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, []);
  return (
    <div
      className="sticky bottom-0 rounded-2xl border bg-[#FBFBFB]"
    > <Textarea
        ref={textareaRef}
        id="message"
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
        onChange={(e) => textareaRef.current.value = e.target.value}
        placeholder="Ask me anything..."
        className="text-md -z-10 bg-inherit !min-h-0 h-14 resize-none border-0 rounded-2xl  shadow-none focus-visible:ring-0 overflow-hidden"
        style={{ maxHeight: '300px', overflowY: 'auto' }}
      />
      <div className="flex item-center mx-auto rounded-2xl justify-between px-4 gap-2 w-full bg-[#F2F2F2] p-1.5">
        <WithToolTip
          component={
            <Paperclip className="w-5 h-5 my-auto rounded-full cursor-pointer" />
          }
          text="Attach file"
        />
        <WithToolTip
          component={
            <ArrowUpCircleIcon
              className="w-8 h-8 my-auto text-white bg-black rounded-full cursor-pointer"
            />
          }
          text="Send"
        />
      </div>
    </div>
  );
};

export default ChatbotInput;
