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
export const MessagesContext = createContext({ isError:false, isLoading:false,user: "123456", messages: [], handlePromptResponse:(message:Message)=>null});

export const MessagesProvider = ({ children }: MessagesProviderProps) => {
    const [user, setUser] = useState('123456')
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [messages,setMessages] = useState<Message[]>([])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem('imdb_user')) {
                setUser(sessionStorage.getItem('imdb_user') || '123456');
            } else {
                sessionStorage.setItem("imdb_user", "123456");
            }
        }
    }, []);

    const handlePromptResponse = async (message:Message) =>{
        try {
               setMessages(prev => [message, ...prev])
               setIsLoading(true)

               const response = await new Promise((res => {
                   setTimeout(() => {
                       const response: Message = {
                           _id: uuid(),
                           isUserMessage: false,
                           text: message.text + " From AI"
                       }
                       res(response);
                   }, 3000)
               })) as Message

               setMessages(prev => [response, ...prev]);
               setIsLoading(false);
            setIsError(true);
            } catch (error) {
             setIsError(true);
             console.log(error)
            } finally{
                setIsLoading(false)
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
