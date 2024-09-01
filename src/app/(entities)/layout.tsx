
import WithChatBot from "@/components/chatbot/withchatbot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex min-h-screen  w-full bg-gradient-center pb-16 pt-5 px-11 ">
      {children}
      <WithChatBot />
    </section>

  );
}
