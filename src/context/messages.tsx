"use client"

import { Message } from "@/utils/types";
import uuid from "react-uuid"
import {
    MutableRefObject,
    ReactNode,
    createContext,
    useEffect,
    useRef,
    useState,
} from "react";

interface MessagesProviderProps {
    children: ReactNode;
}

interface MessagesContextType {
    isError: boolean;
    isLoading: boolean;
    isServingResponse: boolean;
    user: string;
    textareaRef: MutableRefObject<HTMLTextAreaElement>;
    messagesContainerRef: MutableRefObject<HTMLDivElement>;
    messages: Message[];
    handlePromptResponse: (message: Message) => Promise<void>;
}

export const MessagesContext = createContext<MessagesContextType>({
    isError: false,
    isLoading: false,
    isServingResponse: false,
    user: "123456",
    messages: [],
    handlePromptResponse: async () => { },
    textareaRef: null,
    messagesContainerRef:null
});

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
    const [user, setUser] = useState('123456')
    const [isLoading, setIsLoading] = useState(false);
    const [isServingResponse, setIServingResponse] = useState(false);

    const [isError, setIsError] = useState(false);
    const [messages, setMessages] = useState<Message[]>([])
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('imdb_user')) {
                setUser(sessionStorage.getItem('imdb_user') || '123456');
            } else {
                sessionStorage.setItem("imdb_user", "123456");
            }
        }
    }, []);

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePromptResponse = async (message: Message) => {
        try {
            setIsError(false);
            setIsLoading(true)
            scrollToBottom();
            setMessages(prev => [message, ...prev])
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message.text, user }),
            });

            if (!response.ok) {
                throw new Error('Failed to get answer from API');
            }

            const data = await response.json();

            const aiResponse: Message = {
                _id: uuid(),
                isUserMessage: false,
                text: ''
            }
            setMessages(prev => [aiResponse, ...prev]);
            setIServingResponse(true)
            for (let i = 0; i < data.answer.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 20));
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    updatedMessages[0] = {
                        ...updatedMessages[0],
                        text: data.answer.substring(0, i + 1)
                    };
                    return updatedMessages;
                });
            }
        } catch (error) {
            setIsError(true);
            console.error(error);
        } finally {
            setIsLoading(false);
            setIServingResponse(false)
        }
    }
    return (
        <MessagesContext.Provider
            value={{ messagesContainerRef, isServingResponse, user, messages, handlePromptResponse, isLoading, isError, textareaRef }}
        >
            {children}
        </MessagesContext.Provider>
    );
};