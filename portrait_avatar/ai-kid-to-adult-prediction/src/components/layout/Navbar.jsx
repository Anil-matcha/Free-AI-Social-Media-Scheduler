"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  FaCoins,
  FaBars,
  FaTimes,
  FaSignInAlt,
  FaSignOutAlt,
  FaImages,
  FaHome,
  FaTags,
  FaChild,
} from "react-icons/fa";
import { SiVercel } from "react-icons/si";

const REPO_URL = "https://github.com/SamurAIGPT/ai-kid-to-adult-prediction";
const VERCEL_DEPLOY_URL = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(REPO_URL)}`;

const navLinks = [
  { href: "/", label: "Studio", icon: FaHome },
  { href: "/gallery", label: "Gallery", icon: FaImages },
  { href: "/pricing", label: "Pricing", icon: FaTags },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-white mr-4 flex-shrink-0"
        >
          <span className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/20">
            <FaChild className="text-white text-xs" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            <span className="text-white">FutureSelf</span>
            <span className="text-amber-400"> AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`text-xs font-medium px-3 py-1.5 rounded transition-all ${
                  active
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Right Controls */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          {/* Vercel Deploy */}
          <a
            href={VERCEL_DEPLOY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2.5 py-1.5 rounded transition-all"
            title="Deploy to Vercel"
          >
            <SiVercel className="text-xs" />
            <span>Deploy</span>
          </a>

          {/* Credits */}
          {session?.user && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1.5 rounded">
              <FaCoins className="animate-pulse" />
              <span>{session.user.credits ?? 0} credits</span>
            </div>
          )}

          {session?.user ? (
            <div className="relative group flex items-center h-full py-2">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-7 w-7 rounded-full border border-zinc-700 shadow shadow-amber-500/10 cursor-pointer"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center cursor-pointer text-[10px] text-zinc-400 font-bold">
                  {session.user.name ? session.user.name[0].toUpperCase() : "U"}
                </div>
              )}

              {/* Hover Dropdown Card */}
              <div className="hidden group-hover:flex flex-col absolute right-0 top-full mt-1 w-52 bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl z-[250] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex flex-col min-w-0 pb-2.5 border-b border-zinc-800/80">
                  <span className="text-xs font-bold text-white truncate">
                    {session.user.name || "User"}
                  </span>
                  <span className="text-[9px] text-zinc-500 truncate mt-0.5">
                    {session.user.email || ""}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 border border-zinc-800 hover:border-red-500/20 px-3 py-2 rounded transition-all cursor-pointer"
                >
                  <FaSignOutAlt className="text-[9px]" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 px-3 py-1.5 rounded shadow-lg shadow-orange-500/20 transition-all cursor-pointer font-bold"
            >
              <FaSignInAlt />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>

        {/* Mobile: credits + hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          {session?.user && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
              <FaCoins className="animate-pulse" />
              <span>{session.user.credits ?? 0}</span>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown — absolute overlay */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 z-[200] bg-zinc-950/98 backdrop-blur-md border-b border-zinc-800 flex flex-col p-4 gap-2 md:hidden">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2.5 text-sm font-medium px-3 py-2.5 rounded transition-all ${
                  active
                    ? "bg-amber-500/10 text-amber-400"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className="text-xs" />
                {label}
              </Link>
            );
          })}

          <div className="border-t border-zinc-800 pt-3 mt-1 flex flex-col gap-2">
            {session?.user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-3">
                  {session.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="h-9 w-9 rounded-full border border-zinc-700"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {session.user.name || "User"}
                    </span>
                    <span className="text-[9px] text-zinc-500 truncate">
                      {session.user.email || ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 px-4 py-2.5 rounded transition-all cursor-pointer"
                >
                  <FaSignOutAlt />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  signIn("google");
                  setMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-950 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 rounded transition-all cursor-pointer font-bold"
              >
                <FaSignInAlt />
                Sign in with Google
              </button>
            )}
            <a
              href={VERCEL_DEPLOY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-400 border border-zinc-700 px-4 py-2.5 rounded transition-all"
            >
              <SiVercel />
              Deploy to Vercel
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
