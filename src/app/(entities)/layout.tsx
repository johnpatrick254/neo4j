
import WithChatBot from "@/components/chatbot/withchatbot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <WithChatBot />
    </>

  );
}
