import "./globals.css";
import { Providers } from "./providers";
import config from "@/lib/config";

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
    <html lang="en" data-theme={theme}>
      <body className="bg-bg-page text-primary-text min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

