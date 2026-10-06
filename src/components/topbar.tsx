"use client";

import { Building2, Search } from "lucide-react";
import { useTransition } from "react";
import { switchOrg } from "@/lib/actions";
import { ROLE_INFO } from "@/lib/format";
import type { Me, Org } from "@/lib/types";

export function Topbar({
  title,
  me,
  orgs,
  org,
}: {
  title: string;
  me: Me;
  orgs: Org[];
  org: Org | null;
}) {
  const [pending, startTransition] = useTransition();
  const initials = me.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = me.platformRole
    ? ROLE_INFO[me.platformRole].label
    : org
      ? ROLE_INFO[org.role].label
      : "";

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-line pb-5 pl-14 lg:pl-0">
      <h1 className="mr-auto text-2xl font-medium text-brand-600">{title}</h1>

      {org && (
        <form
          action="/devices"
          role="search"
          className="relative order-last w-full sm:order-none sm:w-64"
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <label htmlFor="device-search" className="sr-only">
            Search devices
          </label>
          <input
            id="device-search"
            name="q"
            placeholder="Search devices"
            className="w-full rounded-full border border-line bg-white py-2 pr-4 pl-9 text-sm placeholder:text-muted/80 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 focus:outline-none"
          />
        </form>
      )}

      {orgs.length > 0 && (
        <label className="relative flex items-center">
          <span className="sr-only">Organization</span>
          <Building2
            className="pointer-events-none absolute left-3 h-4 w-4 text-brand-600"
            aria-hidden
          />
          <select
            value={org?.id}
            disabled={pending}
            onChange={(event) =>
              startTransition(() => switchOrg(event.target.value))
            }
            className="max-w-48 appearance-none rounded-full border border-line bg-white py-2 pr-8 pl-9 text-sm font-medium text-ink focus:ring-2 focus:ring-brand-400/30 focus:outline-none"
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute right-3 text-xs text-muted"
            aria-hidden
          >
            ▾
          </span>
        </label>
      )}

      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-full border border-brand-200 bg-brand-50 text-sm font-medium text-brand-700"
          aria-hidden
        >
          {initials}
        </span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-medium">{me.name}</p>
          <p className="text-xs text-muted">{roleLabel}</p>
        </div>
      </div>
    </header>
  );
}
