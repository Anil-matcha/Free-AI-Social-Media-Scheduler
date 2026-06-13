import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "My Podcast Studio - High-Definition AI Narration Generator",
  description: "Create professional podcast voiceovers and narrations instantly using MiniMax Speech 2.6 HD & Turbo models with smooth adjustments.",
  keywords: ["podcast", "ai narration", "text to speech", "voice generator", "minimax speech"],
  alternates: {
    canonical: "/my-podcast",
  },
  openGraph: {
    title: "My Podcast Studio - High-Definition AI Voiceover Generator",
    description: "Create professional podcast voiceovers and narrations instantly using MiniMax Speech 2.6 HD & Turbo models.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Podcast Studio - AI Voiceover Generator",
    description: "Create professional podcast voiceovers and narrations instantly.",
  }
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className="h-full w-full" data-theme={theme}>
      <body className={`${inter.variable} ${outfit.variable} h-full w-full flex flex-col antialiased bg-bg-page text-primary-text font-sans overflow-hidden`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

