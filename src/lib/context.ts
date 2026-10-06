import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "./api";
import { ORG_COOKIE } from "./session";
import type { Me, Org, OrgRole } from "./types";

export interface PanelContext {
  me: Me;
  orgs: Org[];
  /** Selected organization (cookie), or the first one. Null when the user has none. */
  org: Org | null;
}

/** Once per request: who's signed in, their organizations, and the selected one. */
export const getContext = cache(async (): Promise<PanelContext> => {
  const [me, orgs] = await Promise.all([api<Me>("/me"), api<Org[]>("/orgs")]);
  const selected = (await cookies()).get(ORG_COOKIE)?.value;
  return {
    me,
    orgs,
    org: orgs.find((o) => o.id === selected) ?? orgs[0] ?? null,
  };
});

const RANK: Record<OrgRole, number> = { viewer: 0, member: 1, owner: 2 };
export const can = (org: Org | null, min: OrgRole) =>
  !!org && RANK[org.role] >= RANK[min];

/** For org pages: platform staff without a selected organization go to the admin area. */
export async function requireOrg(): Promise<PanelContext & { org: Org }> {
  const context = await getContext();
  if (!context.org) {
    redirect("/admin");
  }
  return context as PanelContext & { org: Org };
}

/** For staff pages: anyone without one of `roles` goes back to the dashboard. */
export async function requireStaff(
  ...roles: Array<NonNullable<Me["platformRole"]>>
): Promise<PanelContext> {
  const context = await getContext();
  if (!context.me.platformRole || !roles.includes(context.me.platformRole)) {
    redirect("/dashboard");
  }
  return context;
}
