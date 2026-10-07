import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const inter = Inter({ 
  variable: "--font-inter", 
  subsets: ["latin"], 
  display: "swap" 
});

export const metadata = {
  title: "Free AI Social Media Scheduler - MuAPI",
  description: "Schedule and publish AI-generated videos directly to YouTube and TikTok.",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className="min-h-screen w-full" data-theme={theme}>
      <body className={`${inter.variable} ${inter.className} min-h-screen w-full flex flex-col antialiased bg-bg-page text-primary-text overflow-x-hidden`}>
        <Providers>
          <Navbar />
          <main className="flex-1 w-full flex flex-col min-h-0">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

