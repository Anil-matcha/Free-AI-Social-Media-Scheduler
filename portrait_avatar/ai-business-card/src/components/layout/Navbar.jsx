"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { FaCoins, FaUser, FaIdCard, FaSignOutAlt, FaGoogle } from "react-icons/fa";
import { SiVercel } from "react-icons/si";
import clsx from "clsx";

const navLinks = [
  { name: "Card Creator", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [...navLinks];
  if (session?.user) {
    links.push({ name: "My Cards", href: "/my-cards" });
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
      {/* Logo + Nav links */}
      <div className="flex items-center gap-6 sm:gap-8 min-w-0">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-gray-900 flex-shrink-0">
          <FaIdCard className="text-violet-600 text-lg" />
          <span className="text-sm sm:text-base">
            <span className="text-violet-600">Card</span>AI
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-5">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-gray-900 border-b-2 border-violet-500 pb-0.5"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: User + Deploy */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {session?.user ? (
          <>
            {/* Credits badge */}
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-full">
              <FaCoins className="text-amber-500 text-xs" />
              {session.user.credits ?? 0}
            </span>

            {/* Avatar */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt={session.user.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <FaUser className="text-xs text-gray-400" />
                  </div>
                )}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-gray-700 max-w-[80px] truncate">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Sign out"
            >
              <FaSignOutAlt className="text-xs" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-all cursor-pointer"
          >
            <FaGoogle className="text-[10px]" />
            <span>Sign in</span>
          </button>
        )}

        {/* Deploy button */}
        <a
          href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-business-card"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-all font-bold text-[10px] tracking-widest uppercase"
        >
          <SiVercel className="text-xs" />
          Deploy
        </a>
      </div>
    </nav>
  );
}
