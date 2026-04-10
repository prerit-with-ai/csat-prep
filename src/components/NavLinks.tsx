"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Timer,
  RotateCcw,
  BarChart2,
  BookOpen,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/mock", label: "Mocks", icon: Timer },
  { href: "/revision", label: "Revision", icon: RotateCcw },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/strategy", label: "Strategy", icon: BookOpen },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors"
            style={{
              color: isActive
                ? "var(--text-primary)"
                : "var(--text-secondary)",
              backgroundColor: isActive ? "var(--bg-tertiary)" : "transparent",
              fontWeight: isActive ? 500 : 400,
            }}
          >
            <Icon size={14} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
