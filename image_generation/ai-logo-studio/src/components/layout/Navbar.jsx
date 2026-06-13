"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { FaCoins, FaUser, FaHandSparkles, FaSignOutAlt, FaGoogle, FaBars, FaTimes } from "react-icons/fa";
import { SiVercel } from "react-icons/si";
import clsx from "clsx";

const navLinks = [
  { name: "Logo Studio", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const links = [...navLinks];
  if (session?.user) {
    links.splice(1, 0, { name: "My Logos", href: "/dashboard" });
  }

  const deployUrl = "https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-logo-studio";

  return (
    <nav className="relative sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-950/80 border-b border-zinc-800/50 backdrop-blur-md text-zinc-100 flex-shrink-0">
      {/* Brand logo */}
      <div className="flex items-center gap-5 sm:gap-7 min-w-0">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-white flex-shrink-0 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            <FaHandSparkles className="text-sm" />
          </div>
          <span className="text-sm sm:text-base leading-none">
            AI Logo<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-black"> Studio</span>
          </span>
        </Link>

        {/* Navigation links for Desktop */}
        <div className="hidden md:flex items-center gap-5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "text-xs sm:text-sm font-semibold transition-colors py-1 relative",
                  isActive
                    ? "text-violet-400"
                    : "text-zinc-400 hover:text-zinc-100"
                )}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right toolbar items for Desktop */}
      <div className="hidden md:flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Deploy button */}
        <a
          href={deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-pointer group"
          title="Deploy your own to Vercel"
        >
          <SiVercel className="text-[10px] text-zinc-300 group-hover:text-white transition-colors" />
          <span>Deploy</span>
        </a>

        {session?.user ? (
          <>
            {/* Credits badge */}
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1.5 rounded-full shadow-inner">
              <FaCoins className="text-amber-400 text-xs animate-pulse" />
              <span>{session.user.credits ?? 0} Credits</span>
            </span>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt={session.user.name} className="h-full w-full object-cover" />
                ) : (
                  <FaUser className="text-xs text-zinc-500" />
                )}
              </div>
              <span className="hidden lg:inline text-xs font-bold text-zinc-300 max-w-[80px] truncate">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={() => signOut()}
              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-lg transition-colors cursor-pointer"
              title="Logout session"
            >
              <FaSignOutAlt className="text-xs" />
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all shadow-md shadow-violet-600/10 cursor-pointer"
          >
            <FaGoogle className="text-[10px]" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
        aria-label="Toggle menu"
      >
        {isOpen ? <FaTimes className="text-xs" /> : <FaBars className="text-xs" />}
      </button>

      {/* Mobile Dropdown Menu (Absolute positioning overlay) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[200] bg-zinc-950 border-b border-zinc-800/80 backdrop-blur-lg flex flex-col p-4 space-y-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  "px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors",
                  isActive
                    ? "bg-violet-950/30 text-violet-400 border border-violet-900/30"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40"
                )}
              >
                {link.name}
              </Link>
            );
          })}

          <hr className="border-zinc-800/60 my-1" />

          {/* User Credits & Auth section on Mobile */}
          {session?.user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded overflow-hidden bg-zinc-800">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt={session.user.name} className="h-full w-full object-cover" />
                    ) : (
                      <FaUser className="text-[10px] text-zinc-500" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-zinc-300 truncate max-w-[140px]">{session.user.name}</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-950/40 border border-amber-800/30 px-2.5 py-1 rounded-full">
                  <FaCoins className="text-amber-400 text-[10px] animate-pulse" />
                  <span>{session.user.credits ?? 0}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-black bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-lg cursor-pointer transition-colors"
                >
                  <SiVercel className="text-xs" />
                  <span>DEPLOY</span>
                </a>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-black bg-red-950/20 hover:bg-red-950/30 text-red-400 border border-red-900/20 rounded-lg cursor-pointer transition-colors"
                >
                  <FaSignOutAlt className="text-xs" />
                  <span>LOGOUT</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <a
                href={deployUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-black bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg cursor-pointer"
              >
                <SiVercel className="text-xs" />
                <span>DEPLOY</span>
              </a>
              <button
                onClick={() => {
                  setIsOpen(false);
                  signIn("google");
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-black bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer shadow-md shadow-violet-600/10"
              >
                <FaGoogle className="text-[10px]" />
                <span>SIGN IN</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
