"use client";

import { signIn, signOut } from "next-auth/react";
import { FaGoogle, FaSignOutAlt } from "react-icons/fa";

export function LoginButton({ className }) {
  return (
    <button
      onClick={() => signIn("google")}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 border border-zinc-800 text-zinc-200 rounded-lg font-medium hover:bg-zinc-900 hover:border-zinc-700 transition-all text-sm outline-none cursor-pointer ${className}`}
    >
      <FaGoogle className="text-xs text-zinc-400" />
      Sign In
    </button>
  );
}

export function SignUpButton({ className }) {
  return (
    <button
      onClick={() => signIn("google")}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-lg font-medium transition-all text-sm outline-none cursor-pointer shadow-lg shadow-rose-500/20 ${className}`}
    >
      Sign Up
    </button>
  );
}

export function SignOutButton({ className }) {
  return (
    <button
      onClick={() => signOut()}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-zinc-800 text-zinc-400 rounded-lg hover:text-zinc-200 hover:border-zinc-700 transition-all outline-none cursor-pointer ${className}`}
    >
      <FaSignOutAlt className="text-[10px]" />
      Sign Out
    </button>
  );
}
