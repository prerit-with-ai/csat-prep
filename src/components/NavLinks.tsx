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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/topics", label: "Topics", icon: Layers },
  { href: "/mock", label: "Mocks", icon: Timer },
  { href: "/revision", label: "Revision", icon: RotateCcw },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors relative"
            style={{
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive ? "2px solid var(--text-primary)" : "2px solid transparent",
              borderRadius: 0,
              paddingBottom: "6px",
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
