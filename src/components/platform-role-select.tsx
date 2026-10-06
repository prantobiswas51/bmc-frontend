"use client";

import { setPlatformRole } from "@/lib/actions";
import type { PlatformRole } from "@/lib/types";
import { RoleSelect } from "./role-select";

const OPTIONS = [
  { value: "none", label: "Customer" },
  { value: "developer", label: "Developer" },
  { value: "super_admin", label: "Super admin" },
] as const;

export function PlatformRoleSelect({
  userId,
  role,
  name,
}: {
  userId: string;
  role: PlatformRole | null;
  name: string;
}) {
  return (
    <RoleSelect
      value={role ?? "none"}
      options={[...OPTIONS]}
      label={`Platform role for ${name}`}
      onSave={(next) => setPlatformRole(userId, next === "none" ? null : next)}
    />
  );
}
