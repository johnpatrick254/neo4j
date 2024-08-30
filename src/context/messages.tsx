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
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface MessagesProviderProps {
    children: ReactNode;
}

interface MessagesContextType {
    isError: boolean;
    isLoading: boolean;
    isServingResponse: boolean;
    isFetchingMessages: boolean;
    user: string;
    textareaRef: MutableRefObject<HTMLTextAreaElement>;
    messagesContainerRef: MutableRefObject<HTMLDivElement>;
    messages: Message[];
    handlePromptResponse: (message: Message, id?: string) => Promise<void>;
}

export const MessagesContext = createContext<MessagesContextType>({
    isError: false,
    isLoading: false,
    isServingResponse: false,
    isFetchingMessages: false,
    user: "123456",
    messages: [],
    handlePromptResponse: async () => { },
    textareaRef: null,
    messagesContainerRef: null
});

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
    const [user, setUser] = useState('123456')
    const [isLoading, setIsLoading] = useState(false);
    const [isServingResponse, setIServingResponse] = useState(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState(true);

    const [isError, setIsError] = useState(false);
    const [messages, setMessages] = useState<Message[]>([{
        _id: "default_message_id",
        isUserMessage: false,
        text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`
    }])
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('imdb_user')) {
                setUser(sessionStorage.getItem('imdb_user'));
            } else {
                sessionStorage.setItem("imdb_user", uuid());
            }
        }
        const user = sessionStorage.getItem('imdb_user');
        const fetchMessages = async (user: string) => {
            setIsFetchingMessages(true);
            console.log(user)
            try {
                const response = await fetch(`/api/?sessionId=${user}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const fetchedMessages = await response.json()
                    console.log(fetchedMessages)
                    setMessages([...fetchedMessages.messages, ...messages]);
                } else {
                    toast({
                        className: cn(
                            'top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4'
                        ),
                        title: "Something went wrong",
                        description: "There was an error fetching previous responses, please refresh.",
                        variant: "destructive",
                    });
                }

            } catch (error) {
                console.log("Error fetching messages:", error);
            } finally {
                setIsFetchingMessages(false);
            }
        }

        fetchMessages(user);
    }, []);

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePromptResponse = async (message: Message, id?: string) => {
        try {
            setIsError(false);
            setIsLoading(true);
            scrollToBottom();

            if (message.isUserMessage && !id) {
                setMessages(prev => [message, ...prev]);
            }

            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message.text, user, retry: id ? true : false, initialResponseId: id ?? '' }),
            });

            if (!response.ok) {
                throw new Error('Failed to get answer from API');
            }

            const data = await response.json() as { answer: string, responseId: string, initialResponseId: string };

            const aiResponse: Message = {
                _id: data.responseId,
                isUserMessage: false,
                text: '',
                previousResponse: []
            };

            if (!id) {
                setMessages(prev => [aiResponse, ...prev]);
            } else {
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const originalMessageIndex = updatedMessages.findIndex(msg => msg._id === data.initialResponseId);

                    if (originalMessageIndex !== -1) {
                        if (!updatedMessages[originalMessageIndex].previousResponse) {
                            updatedMessages[originalMessageIndex].previousResponse = [];
                        }
                        updatedMessages[originalMessageIndex].previousResponse!.unshift(aiResponse);
                    }

                    return updatedMessages;
                });
            }

            setIServingResponse(true);

            for (let i = 0; i < data.answer.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 20));

                setMessages(prev => {
                    const updatedMessages = [...prev];
                    if (!id) {
                        updatedMessages[0] = {
                            ...updatedMessages[0],
                            text: data.answer.substring(0, i + 1),
                        };
                    } else {
                        const originalMessageIndex = updatedMessages.findIndex(msg => msg._id === data.initialResponseId);
                        if (originalMessageIndex !== -1 && updatedMessages[originalMessageIndex].previousResponse) {
                            updatedMessages[originalMessageIndex].previousResponse![0] = {
                                ...updatedMessages[originalMessageIndex].previousResponse![0],
                                text: data.answer.substring(0, i + 1),
                            };
                        }
                    }
                    return updatedMessages;
                });
            }
        } catch (error) {
            setIsError(true);
            console.log(error);
        } finally {
            setIsLoading(false);
            setIServingResponse(false);
        }
    };
    return (
        <MessagesContext.Provider
            value={{
                messagesContainerRef,
                isServingResponse,
                isFetchingMessages,
                user,
                messages,
                handlePromptResponse,
                isLoading,
                isError,
                textareaRef
            }}
        >
            {children}
        </MessagesContext.Provider>
    );
};