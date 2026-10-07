import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "AI SaaS Template - Powered by MUAPI",
  description: "Deploy a premium, monetized credit-based SaaS application in minutes.",
};

import { standaloneConfig } from "@/lib/standaloneConfig";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} data-theme={standaloneConfig.config?.theme || "slate-indigo"}>
      <body className={`${inter.className} h-full antialiased bg-bg-page text-primary-text`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
