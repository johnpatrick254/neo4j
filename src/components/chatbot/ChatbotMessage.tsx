"use client";
import { cn } from "@/lib/utils";
import { FC, useContext, useEffect, useRef, useState } from "react";
import MarkdownLite from "./MarkdownLite";
import { Message } from "@/utils/types";
import { MessagesContext } from "@/context/messages";
import { ChevronLeft, ChevronRight, Copy, Edit, RotateCw, Save, X } from "lucide-react";
import { WithToolTip } from "../ui/WithToolTip";
import star from "../../../public/star-2-svgrepo-com.svg";
import Image from "next/image";

interface ChatbotMessageProps {
  message: Message;
}

const ChatbotMessage: FC<ChatbotMessageProps> = ({ message }) => {
  const { isLoading, isServingResponse, messages, handlePromptResponse } = useContext(MessagesContext);
  const previousResponses = message.previousResponse ? [message,...message.previousResponse] : [message];
  const [currentIndex, setCurrentIndex] = useState((previousResponses.length - 1));
  const [editedContent, setEditedContent] = useState(message.text);
  const [isEditing, setIsEditing] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  let lastMessage = messages.length > 0 && messages.indexOf(message) === 0;
  let currentMessage = previousResponses[currentIndex ];
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, [isEditing]);

  const handleRetry = () => {
    const previousQuery = messages[messages.indexOf(message) + 1];
    handlePromptResponse(previousQuery, currentMessage._id);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentMessage.text);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % previousResponses.length);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + previousResponses.length) % previousResponses.length);
    console.log(previousResponses)
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.text);
  };

  const handleSave = async () => {
    if (editedContent !== message.text) {
      await handlePromptResponse({
        _id: message._id,
        isUserMessage: true,
        text: editedContent
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.text);
  };

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, [isEditing]);

  const adjustTextareaHeight = () => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    adjustTextareaHeight();
  };

  return (
    <div className="chat-message" key={message._id}>
      <div
        className={cn("flex items-end relative mb-6", {
          "justify-end": message.isUserMessage,
        })}
      >
        {(lastMessage && !message.isUserMessage) && <Image alt="star" src={star} height={50} width={50} className="w-6 relative animate-bounce " />}
        <div
          className={cn(
            "flex flex-col gap-2 text-sm max-w-[60%] rounded-t-lg p-3",
            {
              "bg-foreground text-secondary rounded-l-lg text-right":
                message.isUserMessage,
            },
            {
              "bg-accent text-primary rounded-r-lg text-left":
                !message.isUserMessage,
            },
            {
              "w-full":
                isEditing,
            }
          )}
        >
          {isEditing ? (
            <textarea
              ref={editTextareaRef}
              value={editedContent}
              onChange={handleTextareaChange}
              className="bg-transparent border-none focus:ring-0 focus:outline-0 p-0.5 w-full resize-none overflow-hidden"
              style={{ minHeight: '1.5em' }}
            />
          ) : (
              <MarkdownLite text={currentMessage.text} />
          )}
          {message.isUserMessage && !isServingResponse && (
            <div className={`flex gap-2.5 absolute -bottom-6 right-2 ${isLoading ? "opacity-5" : ""}`}>
              {isEditing ? (
                <>
                  <WithToolTip component={<Save onClick={handleSave} className="cursor-pointer" size={18} color="#000000" />} text="Save" />
                  <WithToolTip component={<X onClick={handleCancel} className="cursor-pointer" size={18} color="#000000" />} text="Cancel" />
                </>
              ) : (
                <WithToolTip component={<Edit onClick={handleEdit} className="cursor-pointer" size={18} color="#000000" />} text="Edit" />
              )}
            </div>
          )}
          <div className={`flex gap-2.5 absolute -bottom-6 left-2 ${isLoading ? "opacity-5" : ""}`}>
            {previousResponses.length > 1 &&
              <div className="flex items-center gap-1">
                <ChevronLeft onClick={handlePrevious} className="cursor-pointer" size={15} color="#000000" />
                { currentIndex + 1}
                <ChevronRight onClick={handleNext} className="cursor-pointer" size={15} color="#000000" />
              </div>
            }
            {(!message.isUserMessage && lastMessage && messages.length > 1 && !isServingResponse) && (
              <>
                <WithToolTip key={'copy'} component={<Copy className="cursor-pointer" onClick={handleCopy} size={18} color="#000000" />} text="Copy" />
                <WithToolTip key={'retry'} component={<RotateCw className="cursor-pointer" onClick={handleRetry} size={18} color="#000000" />} text="Retry" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotMessage;