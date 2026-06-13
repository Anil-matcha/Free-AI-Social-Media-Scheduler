import "./globals.css";
import { Providers } from "./providers";
import config from "@/lib/config";

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
    <html lang="en" className="h-full w-full" data-theme={theme}>
      <head>
        <link rel="icon" href="https://newoaks.s3.us-west-1.amazonaws.com/AutoDev/11407/5272b774-1dec-479f-9b03-bb7eeb892b80.jpg" />
      </head>
      <body className="antialiased min-h-screen bg-bg-page text-primary-text flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

