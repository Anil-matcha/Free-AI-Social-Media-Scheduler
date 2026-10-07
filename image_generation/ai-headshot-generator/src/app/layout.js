import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";

const font = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "AI Headshot Generator - Premium Portraits",
  description: "Professional AI headshots for LinkedIn, teams, and creators.",
};

import config from "@/lib/config";

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className="h-dvh w-full transition-colors duration-500" data-theme={theme}>
      <body className={`${font.className} h-dvh w-full flex flex-col antialiased bg-bg-page text-primary-text transition-colors duration-500`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
