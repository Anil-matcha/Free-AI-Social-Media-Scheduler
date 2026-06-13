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
  FaGlobe,
} from "react-icons/fa";
import { SiVercel } from "react-icons/si";

const REPO_URL = "https://github.com/SamurAIGPT/ai-room-declutter";
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-slate-900 mr-4 flex-shrink-0"
        >
          <span className="h-7 w-7 rounded flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <FaGlobe className="text-white text-xs animate-spin-slow" />
          </span>
          <span className="text-sm font-semibold tracking-tight">
            <span className="text-slate-900">FutureRoom</span>
            <span className="text-indigo-600"> AI</span>
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
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
            className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-slate-50 px-2.5 py-1.5 rounded transition-all"
            title="Deploy to Vercel"
          >
            <SiVercel className="text-xs" />
            <span>Deploy</span>
          </a>

          {/* Credits */}
          {session?.user && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded">
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
                  className="h-7 w-7 rounded-full border border-slate-200 shadow shadow-indigo-500/5 cursor-pointer"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer text-[10px] text-slate-600 font-bold">
                  {session.user.name ? session.user.name[0].toUpperCase() : "U"}
                </div>
              )}

              {/* Hover Dropdown Card */}
              <div className="hidden group-hover:flex flex-col absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded p-3 shadow-2xl z-[250] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex flex-col min-w-0 pb-2.5 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {session.user.name || "User"}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate mt-0.5">
                    {session.user.email || ""}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-700 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-3 py-2 rounded transition-all cursor-pointer"
                >
                  <FaSignOutAlt className="text-[9px]" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-white bg-gradient-to-r from-indigo-400 to-violet-500 hover:from-indigo-500 hover:to-violet-600 px-3 py-1.5 rounded shadow-lg shadow-indigo-500/20 transition-all cursor-pointer font-bold"
            >
              <FaSignInAlt />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>

        {/* Mobile: credits + hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          {session?.user && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
              <FaCoins className="animate-pulse" />
              <span>{session.user.credits ?? 0}</span>
            </div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded transition-colors cursor-pointer"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown — absolute overlay */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 z-[200] bg-white/98 backdrop-blur-md border-b border-slate-200 flex flex-col p-4 gap-2 md:hidden shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 text-sm font-medium px-3 py-2.5 rounded transition-all active:bg-indigo-500/10"
                style={{
                  color: active ? "#4f46e5" : "#475569",
                  backgroundColor: active ? "rgba(99, 102, 241, 0.05)" : "transparent"
                }}
              >
                <Icon className="text-xs" />
                {label}
              </Link>
            );
          })}

          <div className="border-t border-slate-200 pt-3 mt-1 flex flex-col gap-2">
            {session?.user ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded p-3">
                  {session.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User Avatar"}
                      className="h-9 w-9 rounded-full border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {session.user.name || "User"}
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">
                      {session.user.email || ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded transition-all cursor-pointer"
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
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2.5 rounded transition-all cursor-pointer font-bold shadow-md shadow-indigo-500/10"
              >
                <FaSignInAlt />
                Sign in with Google
              </button>
            )}
            <a
              href={VERCEL_DEPLOY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 px-4 py-2.5 rounded transition-all bg-slate-50 hover:bg-slate-100"
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
