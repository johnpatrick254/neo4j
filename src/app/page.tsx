import { Dashboard } from "@/components/chatbotv2/dashboard";
import { MessagesProvider } from "@/context/messages";
import { TooltipProvider } from "@radix-ui/react-tooltip";

export default async function Home() {
  return (
    <MessagesProvider>
      <TooltipProvider>
        <Dashboard />
      </TooltipProvider>
    </MessagesProvider>
  );
}
