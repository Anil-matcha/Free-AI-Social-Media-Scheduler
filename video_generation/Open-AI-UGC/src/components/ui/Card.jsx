"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";

export function Card({ children, className, hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={hover ? { y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : {}}
      className={twMerge(
        "glass-card p-6 relative overflow-hidden transition-all",
        className
      )}
      {...props}
    >
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={twMerge("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={twMerge("text-xl font-bold tracking-tight", className)}>{children}</h3>;
}

export function CardContent({ children, className }) {
  return <div className={twMerge("text-muted", className)}>{children}</div>;
}
