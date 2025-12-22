"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/dashboard", label: "Komuta Merkezi" },
  { href: "/simulation", label: "Simülasyon" },
  { href: "/settings", label: "Ayarlar" },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 mb-6 w-full border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold tracking-wider text-accent" aria-label="Ana Sayfa">
          Kariyerin Olsun
        </Link>
        <ul className="flex items-center gap-4 text-sm">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-block rounded-md px-3 py-1 text-accent/80 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60",
                    active && "text-accent"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

