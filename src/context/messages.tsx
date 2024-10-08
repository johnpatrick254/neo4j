"use client"
import { Message, UserSession } from "@/utils/types";
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
    sessionStart: boolean;
    isFetchingMessages: boolean;
    clientId: string;
    textareaRef: MutableRefObject<HTMLTextAreaElement>;
    messagesContainerRef: MutableRefObject<HTMLDivElement>;
    messages: Message[];
    sessions: UserSession[];
    sessionId:string | null;
    handlePromptResponse: (message: Message, id?: string) => Promise<void>;
    handleSessionChange: (session: UserSession | null) => void;
}

export const MessagesContext = createContext<MessagesContextType>({
    isError: false,
    isLoading: false,
    sessionStart: false,
    isFetchingMessages: false,
    clientId: "123456",
    messages: [],
    sessions: [],
    handlePromptResponse: async () => { },
    textareaRef: null,
    messagesContainerRef: null,
    sessionId:null,
    handleSessionChange: (session: UserSession | null) => null
});

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
    const [clientId, setClientId] = useState('123456');
    const [sessionId, setSessionId] = useState<null | string>(null)
    const [isLoading, setIsLoading] = useState(false);
    const [sessionStart, setSessionStart] = useState(false);
    const [isFetchingMessages, setIsFetchingMessages] = useState(true);
    const [isError, setIsError] = useState(false);

    const [messages, setMessages] = useState<Message[]>([{
        _id: "default_message_id",
        isUserMessage: false,
        text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`
    }])
    const [sessions, setSessions] = useState<UserSession[]>([])

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('imdb_user')) {
                setClientId(sessionStorage.getItem('imdb_user'));
            } else {
                const userId = uuid();
                sessionStorage.setItem("imdb_user", userId);
                setClientId(userId);
            }
        }

        const clientId = sessionStorage.getItem('imdb_user');

        const fetchMessages = async (sessionId: string, clientId: string) => {
            setIsFetchingMessages(true);
            try {
                const response = await fetch(`/api/?sessionId=${sessionId ?? ""}&clientId=${clientId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const fetchedMessages = await response.json()
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
        };

        const fetchUserSessions = async (clientId: string) => {
            setIsFetchingMessages(true);
            try {
                const response = await fetch(`/api/session/?clientId=${clientId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const fetchedSessions = await response.json()
                    if (fetchedSessions.sessions.length) {
                        setSessions([...fetchedSessions.sessions]);
                    }
                } else {
                    console.log('err sessison')
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

        fetchMessages(sessionId, clientId);
        fetchUserSessions(clientId);
    }, []);


    useEffect(() => {
        if (!sessionId) {
            setMessages([{
                _id: "default_message_id",
                isUserMessage: false,
                text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`
            }])
        }
    }, [sessionId])

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handlePromptResponse = async (message: Message, id?: string) => {
        try {
            setIsError(false);
            setIsLoading(true);
            scrollToBottom();
            if (id) {
                setSessionStart(false)
            } else {
                setSessionStart(true)
            };

            const newSessionId = uuid();

            if (message.isUserMessage && !id) {
                setMessages(prev => [message, ...prev]);
            }

            if (message.isUserMessage && !sessionId) {
                setSessionId(newSessionId)
                setSessions(prev => {
                    const newSession = { id: newSessionId, firstQuery: message.text }
                    return [newSession, ...prev]
                });
            }

            let currentSession: UserSession | UserSession[] = sessions.filter(session => session.id === sessionId);

            if (!currentSession.length) {
                currentSession = {
                    id: newSessionId,
                    firstQuery: message.text
                }
            } else {
                currentSession = currentSession[0]
            }

            if (currentSession.firstQuery === "Hello Binge watcher, I'm imdBot! How can I help you today ?") {
                setSessions(prev => {
                    let updatedSessions = [...prev]
                    updatedSessions.map(session => {
                        if (session.id === sessionId) {
                            session.firstQuery = message.text
                        }
                    })
                    return updatedSessions;
                })
            }

            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message.text, clientId, sessionId: sessionId ?? newSessionId, retry: id ? true : false, initialResponseId: id ?? '' }),

            });

            if (!response.ok) {
                throw new Error('Failed to get answer from API');
            }

            const data = await response.json() as { answer: string, responseId: string, initialResponseId: string };

            const aiResponse: Message = {
                _id: data.responseId,
                isUserMessage: false,
                text: data.answer,
                previousResponse: []
            };

            setMessages(prev => {
                if (!id) {
                    return [aiResponse, ...prev];
                } else {
                    const updatedMessages = [...prev];
                    const originalMessageIndex = updatedMessages.findIndex(msg => msg._id === data.initialResponseId);

                    if (originalMessageIndex !== -1) {
                        if (!updatedMessages[originalMessageIndex].previousResponse) {
                            updatedMessages[originalMessageIndex].previousResponse = [];
                        }

                        // Check if the response already exists in the previousResponse array
                        const isDuplicate = updatedMessages[originalMessageIndex].previousResponse!.some(
                            prevResponse => prevResponse._id === aiResponse._id
                        );

                        if (!isDuplicate) {
                            updatedMessages[originalMessageIndex].previousResponse!.unshift(aiResponse);
                        }
                    }

                    return updatedMessages;
                }
            });
            setSessionStart(true)

        } catch (error) {
            setIsError(true);
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSessionChange = (session: UserSession | null) => {

        if (!session) {
            const newSessionId = uuid();
            setSessionId(newSessionId);
            setSessions(prev => [...prev, { id: newSessionId, firstQuery: "Hello Binge watcher, I'm imdBot! How can I help you today ?" }]);
            setMessages([{
                _id: "default_message_id",
                isUserMessage: false,
                text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`
            }])
            return;
        }
        if (session.firstQuery !== "Hello Binge watcher, I'm imdBot! How can I help you today ?") {
            setSessionId(session.id);
            const fetchMessages = async (sessionId: string, clientId: string) => {
                setIsFetchingMessages(true);
                try {
                    const response = await fetch(`/api/?sessionId=${sessionId}&clientId=${clientId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const fetchedMessages = await response.json()
                        setMessages([...fetchedMessages.messages, {
                            _id: "default_message_id",
                            isUserMessage: false,
                            text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`
                        }]);
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
            fetchMessages(session.id, clientId);
        } else {
            setMessages(
                [
                    {
                        _id: "default_message_id",
                        isUserMessage: false,
                        text: `Hello Binge watcher, I'm imdBot! How can I help you today ?`
                    }
                ]
            )
        }
    }

    return (
        <MessagesContext.Provider
            value={{
                messagesContainerRef,
                sessionStart,
                isFetchingMessages,
                clientId,
                sessionId,
                messages,
                sessions,
                handlePromptResponse,
                isLoading,
                isError,
                handleSessionChange,
                textareaRef
            }}
        >
            {children}
        </MessagesContext.Provider>
    );
};