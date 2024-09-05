
import WithChatBot from "@/components/chatbot/withchatbot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section className="flex min-h-screen justify-center items-center w-full bg-gradient-center pb-16 px-11 ">
      {children}
      <WithChatBot />
    </section>
  );
}
