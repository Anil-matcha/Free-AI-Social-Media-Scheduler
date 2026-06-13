"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { SiVercel } from "react-icons/si";
import clsx from "clsx";

const navLinks = [
  { name: "Video", href: "/" },
  { name: "Image", href: "/image" },
  { name: "Gallery", href: "/gallery" },
  { name: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-black dark:text-white">
          AI MEME
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={clsx(
                  "text-sm font-medium transition-colors hover:text-black dark:hover:text-white",
                  isActive
                    ? "text-black dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {session?.user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full">
              Credit: {session.user.credits ?? 0}
            </span>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={session.user.image} alt="User profile" className="h-full w-full object-cover" />
            </div>
            <button
              onClick={() => signOut()}
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-white dark:text-black rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Sign in
          </button>
        )}

        <a
          href="https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/ai-meme"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition-all font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-slate-900/10"
        >
          <SiVercel className="text-xs" />
          Deploy
        </a>
      </div>
    </nav>
  );
}
