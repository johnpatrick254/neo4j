"use client"

import { Message } from "@/utils/types";
import uuid from "react-uuid"
import {
    ReactNode,
    createContext,
    useEffect,
    useState,
} from "react";

interface MessagesProviderProps {
    children: ReactNode;
}

interface MessagesContextType {
    isError: boolean;
    isLoading: boolean;
    user: string;
    messages: Message[];
    handlePromptResponse: (message: Message) => Promise<void>;
}

export const MessagesContext = createContext<MessagesContextType>({
    isError: false,
    isLoading: false,
    user: "123456",
    messages: [],
    handlePromptResponse: async () => { }
});

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
    const [user, setUser] = useState('123456')
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [messages, setMessages] = useState<Message[]>([])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('imdb_user')) {
                setUser(sessionStorage.getItem('imdb_user') || '123456');
            } else {
                sessionStorage.setItem("imdb_user", "123456");
            }
        }
    }, []);

    const handlePromptResponse = async (message: Message) => {
        try {
            setIsError(false);
            setIsLoading(true)
            
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message.text ,user}),
            });

            if (!response.ok) {
                throw new Error('Failed to get answer from API');
            }

            const data = await response.json();

            const aiResponse: Message = {
                _id: uuid(),
                isUserMessage: false,
                text: data.answer
            }
            setMessages(prev => [message, ...prev])
            setMessages(prev => [aiResponse, ...prev]);
        } catch (error) {
            setIsError(true);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <MessagesContext.Provider
            value={{ user, messages, handlePromptResponse, isLoading, isError }}
        >
            {children}
        </MessagesContext.Provider>
    );
};