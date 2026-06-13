"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-divider/40 bg-bg-page py-6 text-center text-xs text-secondary-text mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          &copy; {currentYear} AI SaaS Studio. All rights reserved.
        </div>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-primary-text transition-colors">
            Terms of Service
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/privacy" className="hover:text-primary-text transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
