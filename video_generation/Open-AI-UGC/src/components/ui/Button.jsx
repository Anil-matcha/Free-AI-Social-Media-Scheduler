"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function Button({ 
  children, 
  className, 
  variant = "primary", 
  size = "md", 
  isLoading = false,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95";
  
  const variants = {
    primary: "bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600",
    secondary: "bg-secondary-500 text-white shadow-lg shadow-secondary-500/25 hover:bg-secondary-600",
    outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-500/10",
    glass: "glass-card hover:bg-glass-hover text-foreground",
    ghost: "hover:bg-primary-500/10 text-primary-500",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  );
}
