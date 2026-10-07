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
  title: "FutureTravel AI Studio — Photorealistic Scenic Background Swaps",
  description:
    "Place yourself in gorgeous landmarks and travel destinations worldwide instantly. Upload your portrait, select iconic presets (Paris, Kyoto, Colosseum, Maldives), and get a photorealistic travel snapshot powered by DeepMind AI.",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className={`${inter.variable} h-full w-full`} data-theme={theme}>
      <body className={`${inter.className} h-full w-full flex flex-col antialiased bg-bg-page text-primary-text lg:overflow-hidden overflow-y-auto`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col lg:overflow-hidden overflow-visible lg:min-h-0 min-h-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

