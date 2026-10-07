import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const font = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Resale Photo Enhancer - background swap and enhance product photos",
  description: "Enhance your product photos instantly with background templates or custom prompts.",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className={`${font.variable} h-full w-full`} data-theme={theme}>
      <body className="font-sans h-full w-full flex flex-col antialiased bg-bg-page text-primary-text overflow-hidden">
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

