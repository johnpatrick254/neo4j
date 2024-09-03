"use client";
import { cn } from "@/lib/utils";
import { FC, useContext, useEffect, useRef, useState } from "react";
import MarkdownLite from "./MarkdownLite";
import { Message } from "@/utils/types";
import { MessagesContext } from "@/context/messages";
import { ChevronLeft, ChevronRight, Copy, Edit, RotateCw, Save, SparklesIcon, X } from "lucide-react";
import { WithToolTip } from "../ui/WithToolTip";
import star from "../../../public/star-2-svgrepo-com.svg";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ChatbotMessageProps {
  message: Message;
}

const ChatbotMessage: FC<ChatbotMessageProps> = ({ message }) => {
  const { isLoading, isServingResponse, messages, handlePromptResponse, messagesContainerRef } = useContext(MessagesContext);
  const previousResponses = message.previousResponse ? [message, ...message.previousResponse] : [message];
  const [currentIndex, setCurrentIndex] = useState((previousResponses.length - 1));
  const [editedContent, setEditedContent] = useState(message.text);
  const [isEditing, setIsEditing] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isLatestAIMessage = !message.isUserMessage && messages[0]._id === message._id;
  const isLastMessage = messages[0]._id === message._id
  let currentMessage = previousResponses[currentIndex];
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isLatestAIMessage) {
      setIsTyping(true);
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < currentMessage.text.length) {
          setDisplayedText(currentMessage.text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTyping(false);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    } else {
      setDisplayedText(currentMessage.text);
    }
  }, [currentMessage.text, isLatestAIMessage]);

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
    <div className="chat-message text-base" key={message._id} >
    {
      message.isUserMessage
      ?
          <div
            className={"flex nowrap gap-2.5 items-center relative mb-6 py-2.5 px-3 rounded-2xl bg-foreground text-secondary"}
          >
            <Avatar className="min-w-9 self-start min-h-9 text-primary">
              <AvatarImage src="https://github.com/shadcn5.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div
              className={" flex flex-col gap-5 w-full "}
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
                isTyping ? (
                  <MarkdownLite text={displayedText} />
                ) : (
                  <MarkdownLite text={currentMessage.text} />
                )
              )}
              {!isServingResponse && (
                <div className={`flex justify-start gap-2.5  ${isLoading ? "opacity-0" : ""}`}>
                  {isEditing ? (
                    <>
                      <WithToolTip component={<Save onClick={handleSave} className="cursor-pointer  text-white" size={18} />} text="Save" />
                      <WithToolTip component={<X onClick={handleCancel} className="cursor-pointer  text-white" size={18} />} text="Cancel" />
                    </>
                  ) : (
                    <WithToolTip component={<Edit onClick={handleEdit} className="cursor-pointer text-white" size={18}  />} text="Edit" />
                  )}
                </div>
              )}
            </div>
          </div>
      :
          <div className="chat-message" key={message._id}>
            <div
              className={"flex nowrap gap-2.5 items-center relative mb-6 bg-accent py-2.5 px-3 rounded-2xl"}
            >
              {<SparklesIcon className="min-w-9 self-start min-h-9 rounded-full p-2 relative " />}
              <div
                className={'flex flex-col gap-5 w-full'}
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
                  isTyping ? (
                    <MarkdownLite text={displayedText} />
                  ) : (
                    <MarkdownLite text={currentMessage.text} />
                  )
                )}
                <div className={`flex justify-start gap-2.5  ${isLoading ? "opacity-0" : ""}`}>
                  {previousResponses.length > 1 &&
                    <div className="flex items-center gap-1">
                      <ChevronLeft onClick={handlePrevious} className="cursor-pointer" size={15} color="#000000" />
                      {currentIndex + 1}
                      <ChevronRight onClick={handleNext} className="cursor-pointer" size={15} color="#000000" />
                    </div>
                  }
                  {(!message.isUserMessage && !isServingResponse) && (
                    <>
                      <WithToolTip key={'copy'} component={<Copy className="cursor-pointer" onClick={handleCopy} size={18} color="#000000" />} text="Copy" />
                      <WithToolTip key={'retry'} component={<RotateCw className="cursor-pointer" onClick={handleRetry} size={18} color="#000000" />} text="Retry" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
    }
    </div>
  );
};

export default ChatbotMessage;