import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import config from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "Open Character AI - Futuristic Persona Chat Portal",
  description: "Open-source Character.AI alternative — chat with high-fidelity pre-defined or custom-created AI personas, with per-chat LLM tuning, powered by Next.js, Prisma, and Supabase.",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className={`h-full scroll-smooth ${inter.variable} ${outfit.variable}`} data-theme={theme}>
      <body
        className={`${inter.className} min-h-full flex flex-col antialiased bg-bg-page text-primary-text`}
      >
        <Providers>
          <main className="relative z-10 flex-1 flex flex-col">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

