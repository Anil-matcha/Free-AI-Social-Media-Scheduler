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
  title: "KnowBase AI - Custom Knowledge Agent Workspace",
  description: "Construct bespoke, semantic AI knowledge bases with files, scraping URLs, or typing Q&As and run query playgrounds with high fidelity citations.",
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
