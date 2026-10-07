"use client";

import {
  Cpu,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  PackagePlus,
  RadioTower,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/actions";
import type { PlatformRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const MAIN: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/members", label: "Members & roles", icon: Users },
];

function platformNav(role: PlatformRole | null): NavItem[] {
  if (!role) return [];
  return [
    { href: "/admin", label: "Platform overview", icon: ShieldCheck },
    { href: "/admin/devices", label: "Provisioning", icon: PackagePlus },
  ];
}

/** Admin: MQTT users (staff; editing is super_admin only) and Users (super_admin). */
function adminNav(role: PlatformRole | null): NavItem[] {
  if (!role) return [];
  return [
    { href: "/admin/mqtt", label: "MQTT users", icon: RadioTower },
    ...(role === "super_admin"
      ? [{ href: "/admin/users", label: "Users", icon: KeyRound }]
      : []),
  ];
}

export function Sidebar({
  platformRole,
  canClaim,
  hasOrg,
}: {
  platformRole: PlatformRole | null;
  canClaim: boolean;
  hasOrg: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  const renderLinks = (items: NavItem[]) =>
    items.map(({ href, label, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        aria-current={isActive(href) ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          isActive(href)
            ? "bg-white font-medium text-brand-700 shadow-sm"
            : "text-white hover:bg-white/10"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        {label}
      </Link>
    ));

  const sections = [
    { label: "Platform", items: platformNav(platformRole) },
    { label: "Admin", items: adminNav(platformRole) },
  ].filter((section) => section.items.length);
  const content = (
    <>
      <div className="flex items-center gap-3 px-2 text-white">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-lg font-bold">
          B
        </span>
        <div className="leading-tight">
          <p className="font-medium">BongoMaker</p>
          <p className="text-xs text-white">Control</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-col gap-1.5" aria-label="Main">
        {hasOrg && renderLinks(MAIN)}
      </nav>

      {sections.map((section) => (
        <nav
          key={section.label}
          className="mt-6 flex flex-col gap-1.5"
          aria-label={section.label}
        >
          <p className="px-4 pb-1 text-xs font-medium tracking-wide text-white uppercase">
            {section.label}
          </p>
          {renderLinks(section.items)}
        </nav>
      ))}

      <div className="mt-auto space-y-4 pt-8">
        {canClaim && (
          <div className="rounded-2xl bg-white p-4 text-ink">
            <p className="font-medium text-brand-600">Add a device</p>
            <p className="mt-1 text-sm text-muted">
              Enter the hardware ID and claim code printed on the label.
            </p>
            <Link
              href="/devices?claim=1"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex w-full justify-center rounded-xl bg-leaf-700 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-800"
            >
              Claim device
            </Link>
          </div>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            Log out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow lg:hidden"
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-nav"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="mobile-nav"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-brand-600 p-6 transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-5 right-4 text-white"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        {content}
      </aside>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto rounded-r-[28px] bg-brand-600 p-6 lg:flex">
        {content}
      </aside>
    </>
  );
}
