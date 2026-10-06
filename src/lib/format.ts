import type { OrgRole, PlatformRole } from "./types";

/** Device types this panel supports for now. */
export const DEVICE_TYPES = {
  fanled: "Fan + LED controller",
  rgb_bar: "Monitor bar light",
} as const;
export type SupportedType = keyof typeof DEVICE_TYPES;
export const isSupported = (key: string): key is SupportedType =>
  key in DEVICE_TYPES;

export const ROLE_INFO: Record<
  OrgRole | PlatformRole,
  { label: string; scope: string; can: string }
> = {
  super_admin: {
    label: "Super admin",
    scope: "Platform",
    can: "Everything in every organization, plus users and staff roles.",
  },
  developer: {
    label: "Developer",
    scope: "Platform",
    can: "Provision devices and read every organization for support and debugging.",
  },
  owner: {
    label: "Owner",
    scope: "Organization",
    can: "Claim and remove devices, manage locations and members.",
  },
  member: {
    label: "Member",
    scope: "Organization",
    can: "Control devices: change settings and run effects.",
  },
  viewer: {
    label: "Viewer",
    scope: "Organization",
    can: "See devices, state and history. Read only.",
  },
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size)
      return rtf.format(Math.round(seconds / size), unit);
  }
  return Math.abs(seconds) < 10 ? "just now" : rtf.format(seconds, "second");
}

export const deviceName = (d: { name: string | null; hardwareId: string }) =>
  d.name ?? d.hardwareId;
