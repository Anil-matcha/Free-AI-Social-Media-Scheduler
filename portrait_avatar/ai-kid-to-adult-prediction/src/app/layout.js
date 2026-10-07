import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "AI Kid to Adult Prediction — See Future Appearance Instantly",
  description:
    "Predict how your child will look as an adult with stunning photorealistic accuracy using Google DeepMind's Nano Banana 2 models.",
};

import config from "@/lib/config";

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
