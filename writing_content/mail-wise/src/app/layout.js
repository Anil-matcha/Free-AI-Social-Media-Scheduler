import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import config from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Mail-Wise — Elite AI Email Composer & Cold Outreach Assistant",
  description:
    "Generate highly optimized, conversion-driven business email drafts, cold pitches, meeting requests, and follow-ups with advanced AI.",
  keywords: "AI email writer, cold outreach, email composer, sales pitches, follow-ups, copywriter",
  openGraph: {
    title: "Mail-Wise — Elite AI Email Composer",
    description: "Generate highly optimized, conversion-driven business email drafts with AI.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className={`h-full w-full ${inter.variable} ${outfit.variable}`} data-theme={theme}>
      <head>
        <link rel="icon" href="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/11407/5272b774-1dec-479f-9b03-bb7eeb892b80.jpg" />
      </head>
      <body className={`${inter.className} antialiased h-full w-full bg-bg-page text-primary-text font-sans flex flex-col overflow-hidden`}>
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

