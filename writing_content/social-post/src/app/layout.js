import "./globals.css";
import { Providers } from "./providers";
import config from "@/lib/config";

export const metadata = {
  title: "AI Social Post — Premium Social Media Post Generator",
  description:
    "Generate highly optimized, engaging social media posts with AI. Adapt descriptions, hooks, and call-to-actions specifically for LinkedIn, Twitter, Facebook, and Instagram instantly.",
  keywords: "AI social media, post generator, LinkedIn generator, tweet generator, copywriter, digital marketing",
  openGraph: {
    title: "AI Social Post — Premium Social Media Post Generator",
    description: "Generate highly optimized, engaging social media posts with AI.",
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

