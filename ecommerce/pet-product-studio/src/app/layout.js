import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const font = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Pet Product Studio - generate photorealistic pet and product ad scenes",
  description: "Generate beautiful, brand-agnostic ad images featuring your pet product and pets in use.",
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

