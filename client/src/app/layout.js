import { Inter } from "next/font/google";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OpenSpaces - Autonomous AI Workspace & Pages",
  description: "Open Spaces collaborative workspace with Pages, Dots (autonomous agents), and meeting intelligence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${inter.className}`}>
      <body className={`${inter.className} min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-200`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
