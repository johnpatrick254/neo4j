import ChatbotInput from "@/components/chatbot/ChatbotInput";
import ChatbotMessages from "@/components/chatbot/ChatbotMessages";
import { MessagesProvider } from "@/context/messages";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-4">
      <MessagesProvider>
        <div
          className="flex flex-col h-[500px] 2xl:h-[800px] w-[700px] max-w-[768px] py-0 g  border border-input rounded-md"
        >
          <ChatbotMessages className="px-4 pt-6 pb-3 flex-1" />
          <ChatbotInput />
        </div>
      </MessagesProvider>
    </main>
  );
}
