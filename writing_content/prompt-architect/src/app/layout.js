import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import config from "@/lib/config";
import Navbar from "../components/Navbar";

const font = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Prompt Architect",
  description: "Elite Prompt Engineering Workspace SaaS",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html
      lang="en"
      className={`${font.variable} h-full antialiased`}
      data-theme={theme}
    >
      <body className="min-h-full flex flex-col bg-bg-page text-primary-text font-sans">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}

