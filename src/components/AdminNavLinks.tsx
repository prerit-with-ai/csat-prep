"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  Layers,
  BarChart2,
  Upload,
  Flag,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle, exact: false },
  { href: "/admin/topics", label: "Topics", icon: Layers, exact: false },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2, exact: false },
  { href: "/admin/import", label: "Import", icon: Upload, exact: false },
  { href: "/admin/flags", label: "Flags", icon: Flag, exact: false },
];

export function AdminNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {adminNavItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");
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
