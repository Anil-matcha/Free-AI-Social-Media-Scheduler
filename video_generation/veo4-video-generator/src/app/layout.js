import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";

const font = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Veo 3.1 - Premium AI Generator",
  description: "The next evolution of AI video generation.",
};

export default function RootLayout({ children }) {
  const theme = process.env.NEXT_PUBLIC_THEME || 'indigo';

  return (
    <html lang="en" className="h-dvh w-full transition-colors duration-500" data-theme={theme} style={{ colorScheme: 'light' }}>
      <body className={`${font.className} h-dvh w-full flex flex-col antialiased transition-colors duration-500`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
