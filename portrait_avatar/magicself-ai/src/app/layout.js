import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "MagicSelf AI — Transform Your Selfies Into Masterpieces",
  description:
    "Transform your selfies into stunning AI-generated artwork instantly. Convert selfies into Oil Paintings, Watercolors, Digital Art, Anime, and more using Nano Banana 2.",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className="h-full w-full" data-theme={theme}>
      <body
        className={`${inter.variable} ${inter.className} h-full w-full flex flex-col antialiased bg-bg-page text-primary-text overflow-hidden`}
      >
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

