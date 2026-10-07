"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { LoginButton, SignUpButton, SignOutButton } from "./AuthButtons";
import { CreditBadge } from "./CreditBadge";
import { FaHeart, FaBars, FaTimes } from "react-icons/fa";
import { SiVercel } from "react-icons/si";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md text-zinc-100 sticky top-0 z-[100]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">

        {/* Logo and Brand */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-transform group-hover:scale-110">
            <FaHeart className="text-xs animate-pulse" />
          </div>
          <span className="font-semibold text-white tracking-tight text-md bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
            AI Kissing Video
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors py-1 ${pathname === "/"
                ? "text-white border-b-2 border-rose-500 pb-0.5"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            <span>Generator</span>
            <FaHeart className="text-[8px] text-rose-400" />
          </Link>
          <Link
            href="/gallery"
            className={`text-sm font-medium transition-colors py-1 ${pathname === "/gallery"
                ? "text-white border-b-2 border-rose-500 pb-0.5"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            Gallery
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-medium transition-colors py-1 ${pathname === "/pricing"
                ? "text-white border-b-2 border-rose-500 pb-0.5"
                : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            Pricing
          </Link>
        </nav>

        {/* Auth / Account Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {session?.user && <CreditBadge credits={session.user.credits ?? 0} />}

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-7 w-20 animate-pulse bg-zinc-800 rounded-sm" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <Link href="/pricing" className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-rose-500/10">
                  Buy Hearts
                </Link>

                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User Profile"}
                    className="h-6 w-6 rounded-full border border-rose-500/20"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                    {session.user.name ? session.user.name[0].toUpperCase() : "U"}
                  </div>
                )}

                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <LoginButton />
                <SignUpButton />
              </div>
            )}

            {/* Deploy Button */}
            <a 
              href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-kissing-video-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg"
            >
              <SiVercel className="text-xs" />
              Deploy
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md text-zinc-100 px-6 py-5 space-y-4 shadow-2xl z-[200]">
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium py-1 transition-colors ${pathname === "/" ? "text-rose-400 font-semibold" : "text-zinc-400"}`}
            >
              Generator
            </Link>
            <Link
              href="/gallery"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium py-1 transition-colors ${pathname === "/gallery" ? "text-rose-400 font-semibold" : "text-zinc-400"}`}
            >
              Gallery
            </Link>
            <Link
              href="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium py-1 transition-colors ${pathname === "/pricing" ? "text-rose-400 font-semibold" : "text-zinc-400"}`}
            >
              Pricing
            </Link>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 flex flex-col gap-3">
            {status === "loading" ? (
              <div className="h-8 w-full animate-pulse bg-zinc-800 rounded-sm" />
            ) : session?.user ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg text-center text-xs font-semibold transition-all shadow-lg"
                >
                  Buy Hearts
                </Link>
                <div className="flex items-center gap-2.5 py-1">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Profile"}
                      className="h-6 w-6 rounded-full border border-rose-500/20"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                      {session.user.name ? session.user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <span className="text-xs text-zinc-300 truncate">{session.user.name || session.user.email}</span>
                </div>
                <div className="border-t border-zinc-900/50 pt-2">
                  <SignOutButton />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <LoginButton className="w-full" />
                <SignUpButton className="w-full" />
              </div>
            )}

            {/* Mobile Deploy Button */}
            <a 
              href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-kissing-video-generator"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-850 transition-all font-bold text-xs uppercase shadow-lg"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <SiVercel className="text-xs" />
              Deploy to Vercel
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
