import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "AI Royal Portrait — Transform Your Photo into Royalty",
  description:
    "Upload your photo and transform it into stunning royal portraits with AI. Choose from 20+ professional styles including hair, makeup, accessories, outfits and cinematic lighting effects.",
  keywords: "AI portrait, royal portrait, photo transformation, AI makeup, AI hair style, portrait generator",
  openGraph: {
    title: "AI Royal Portrait — Transform Your Photo into Royalty",
    description: "Upload your photo and transform it into stunning royal portraits with AI.",
    type: "website",
  },
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

