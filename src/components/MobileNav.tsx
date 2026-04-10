"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Timer,
  RotateCcw,
  BarChart2,
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/mock", label: "Mocks", icon: Timer },
  { href: "/revision", label: "Revision", icon: RotateCcw },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border-default)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center flex-1 py-2 gap-1 text-xs transition-colors"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
              fontWeight: isActive ? 500 : 400,
            }}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2 : 1.5}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
