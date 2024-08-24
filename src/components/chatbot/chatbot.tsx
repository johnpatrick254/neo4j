"use client";

import {  useQuery } from "@tanstack/react-query";
import { FC } from "react";
import ChatbotHeader from "./ChatbotHeader";
import ChatbotInput from "./ChatbotInput";
import ChatbotMessages from "./ChatbotMessages";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

const ChatBot: FC = () => {
    return (
        <Sheet >
            <div className="fixed xl:right-[5%] bottom-0 w-[94%] lg:w-4/5 xl:w-3/5 bg-card border border-input rounded-t-md">
                <SheetTrigger className="flex items-center w-full h-full ring-offset-background">
                    <ChatbotHeader />
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="flex flex-col h-3/4 px-0 py-0 gap-0 left-[65%] w-[30%] border border-input rounded-t-md"
                >
                    <ChatbotMessages  className="px-4 pt-6 pb-3 flex-1" />
                    <ChatbotInput />
                </SheetContent>
            </div>
        </Sheet>
    );
};

export default ChatBot;
