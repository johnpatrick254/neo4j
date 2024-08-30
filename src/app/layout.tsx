import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import WithChatBot from "@/components/chatbot/withchatbot";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "imd-bot",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} `}>
        <section className="px-40 min-h-screen">
          <nav className="px-8 py-4 flex items-center justify-end gap-3">
            <Link className="underline" href="/">Home</Link>
            <Link className="underline" href="/movies/page/1">Movies</Link>
            <Link className="underline" href="/actor/page/1">Actors</Link>
            <Link className="underline"  href="/director/page/1">Directors</Link>
          </nav>
        {children}
        </section>
        <Toaster/>
        </body>
    </html>
  );
}
