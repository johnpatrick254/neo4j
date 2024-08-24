"use client"
import ChatBot from "@/components/chatbot/chatbot";
import { MessagesProvider } from "@/context/messages";

export default function WithChatBot() {
    return (
                <MessagesProvider>
                <ChatBot />
                </MessagesProvider>
    );
}
