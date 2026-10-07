"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FaCoins, FaSignOutAlt, FaBars, FaTimes, FaDumbbell } from "react-icons/fa";
import { SiVercel } from "react-icons/si";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginButton } from "./AuthButtons";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Simulator", href: "/" },
    { name: "Gallery", href: "/gallery" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <nav className="h-20 border-b border-glass-border bg-glass-bg backdrop-blur-3xl sticky top-0 z-[100] px-4 md:px-12 flex items-center justify-between">
      {/* Logo Section */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform">
          <FaDumbbell className="text-white text-lg" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter leading-none italic uppercase text-foreground drop-shadow-sm">FIT SIMULATOR</span>
          <span className="text-[10px] font-black tracking-[0.3em] text-primary-500/80 uppercase">Body Engine</span>
        </div>
      </Link>

      {/* Navigation Links (Desktop) */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          // Hide Gallery from guests
          if (!session && link.href === "/gallery") return null;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-semibold tracking-tight transition-all relative py-2 ${
                isActive ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {link.name}
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <>
            <Link href="/pricing" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded bg-glass-bg border border-glass-border hover:bg-glass-hover transition-all group shadow-sm drop-shadow-sm">
              <FaCoins className="text-yellow-500 text-xs group-hover:scale-125 transition-transform" />
              <div className="flex flex-col items-start leading-none gap-1">
                <span className="text-[8px] font-medium text-muted uppercase tracking-wider">Balance</span>
                <span className="text-xs font-semibold text-foreground">{session.user.credits} Credits</span>
              </div>
            </Link>
            
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 p-1 rounded hover:bg-glass-bg transition-all outline-none cursor-pointer"
              >
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full ring-2 ring-primary-500/20 shadow-lg"
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-4 w-56 bg-glass-bg border border-glass-border rounded shadow-2xl p-2 z-[200] backdrop-blur-3xl"
                  >
                    <div className="flex flex-col gap-2 p-3 border-b border-glass-border">
                      <div className="text-[9px] font-bold text-muted uppercase tracking-wider">Account</div>
                      <h3 className="text-xs font-bold text-foreground truncate">{session.user.name}</h3>
                      <div className="text-[10px] text-muted truncate">{session.user.email}</div>
                    </div>
                    
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center justify-between p-3 rounded hover:bg-red-950/20 text-muted hover:text-red-400 transition-all font-semibold text-xs group cursor-pointer"
                    >
                      Sign Out
                      <FaSignOutAlt className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <LoginButton className="!h-10 !px-6 !text-[10px] !tracking-widest !font-bold" />
        )}

        <a 
          href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-fitness-body-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 px-4 py-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100/80 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-emerald-500/5"
        >
          <SiVercel className="text-xs" />
          Deploy
        </a>
        
        {/* Mobile menu toggle */}
        <button 
          className="md:hidden ml-2 p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown (Absolute Overlay) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-glass-bg/95 backdrop-blur-3xl border-b border-glass-border shadow-2xl flex flex-col md:hidden z-[200] p-4 gap-2"
          >
            {navLinks.map((link) => {
              if (!session && link.href === "/gallery") return null;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-4 rounded font-semibold text-sm transition-all ${
                    isActive 
                      ? "bg-primary-500/10 text-primary-400" 
                      : "text-muted hover:bg-glass-hover hover:text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            
            {/* Mobile Credits Display */}
            {session && (
              <div className="mt-2 p-4 rounded bg-glass-bg border border-glass-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center">
                    <FaCoins className="text-yellow-500 text-sm" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-muted uppercase tracking-widest leading-none mb-1">Balance</span>
                    <span className="text-sm font-black text-foreground">{session.user.credits} Credits</span>
                  </div>
                </div>
                <Link 
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold transition-all hover:bg-emerald-500"
                >
                  Top Up
                </Link>
              </div>
            )}

            {/* Mobile Deploy Button */}
            <a 
              href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-fitness-body-simulator"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100/80 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-emerald-500/5"
            >
              <SiVercel className="text-xs" />
              Deploy
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
