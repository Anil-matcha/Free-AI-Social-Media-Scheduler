'use client'

import React from 'react'
import { ThemeProvider } from 'next-themes'

export const AgentThemeProvider = ({ children }) => {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

export default AgentThemeProvider
