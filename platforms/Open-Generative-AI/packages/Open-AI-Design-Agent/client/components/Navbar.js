"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useApi } from "@/context/ApiContext";
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "next-themes";

const Navbar = () => {
  const pathname = usePathname();
  const { userData, loading } = useApi();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full">
      <header className="sticky top-0 z-30 w-full transition-all duration-500 flex flex-col items-center bg-bg-page/40 dark:bg-bg-page/60 backdrop-blur-md border-b border-divider">
        <div className="flex items-center justify-between py-3 w-full max-w-[90%] xl:max-w-[1400px] gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center flex-shrink-0 transition-transform duration-300 hover:scale-[1.02] active:scale-95">
              <span className="text-xl font-bold tracking-tight">Open AI Design Agent</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 justify-end">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-bg-page rounded-full text-secondary-text transition-colors"
            >
              {!mounted ? <div className="w-[15px] h-[15px]" /> : resolvedTheme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {!loading && userData && (
              <div className="flex items-center gap-3">
                <span className="font-bold text-[13px] px-3 py-1.5 border border-divider rounded bg-bg-page/30">
                  $ {userData.balance || "0.00"}
                </span>
                <span className="text-sm font-bold text-primary-text hidden sm:block">{userData.username || "User"}</span>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Navbar;
