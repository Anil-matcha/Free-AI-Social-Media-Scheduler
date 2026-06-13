"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { FaCoins, FaUser, FaTshirt, FaSignOutAlt, FaGoogle } from "react-icons/fa";
import { SiVercel } from "react-icons/si";
import clsx from "clsx";

const navLinks = [
  { name: "TryOn Studio", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [...navLinks];
  if (session?.user) {
    links.splice(1, 0, { name: "My try-ons", href: "/dashboard" });
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-950/80 border-b border-zinc-800/50 backdrop-blur-md text-zinc-100 flex-shrink-0">
      {/* Brand logo */}
      <div className="flex items-center gap-5 sm:gap-7 min-w-0">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-white flex-shrink-0 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
            <FaTshirt className="text-sm" />
          </div>
          <span className="text-sm sm:text-base leading-none">
            TryOn<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 font-black">AI</span>
          </span>
        </Link>

        {/* Navigation links */}
        <div className="hidden sm:flex items-center gap-5">
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

      {/* Right toolbar items */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Deploy button — always visible */}
        <a
          href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-tryon"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg transition-all cursor-pointer group"
          title="Deploy your own to Vercel"
        >
          <SiVercel className="text-[10px] text-zinc-300 group-hover:text-white transition-colors" />
          <span>Deploy</span>
        </a>

        {session?.user ? (
          <>
            {/* Credits badge */}
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-full shadow-inner">
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

            {/* Sign out */}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
              title="Sign out"
            >
              <FaSignOutAlt className="text-xs" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </>
        ) : (
          /* Sign in with Google */
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] rounded-lg shadow-lg shadow-violet-500/20 transition-all cursor-pointer"
          >
            <FaGoogle className="text-[10px]" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </nav>
  );
}
