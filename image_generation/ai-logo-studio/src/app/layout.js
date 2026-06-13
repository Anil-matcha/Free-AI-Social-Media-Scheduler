import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Logo Studio - Premium Custom Vector Logo Generator",
  description: "Create professional-grade vector logos instantly using advanced AI models. Generate custom brand identities or refine sketches in seconds.",
  keywords: ["logo generator", "ai logo", "vector logo maker", "brand builder", "nano banana"],
  alternates: {
    canonical: "/ai-logo-studio",
  },
  openGraph: {
    title: "AI Logo Studio - Premium AI Vector Logo Generator",
    description: "Create professional-grade vector logos instantly using advanced AI models.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Logo Studio - AI Logo Generator",
    description: "Create professional-grade vector logos instantly using AI.",
  }
};

import config from "@/lib/config";

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
