"use client";

import { ThemeProvider } from "next-themes";
import { ApiProvider } from "@/context/ApiContext";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ApiProvider>
        {children}
      </ApiProvider>
    </ThemeProvider>
  );
}
