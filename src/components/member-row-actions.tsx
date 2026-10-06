"use client";

import { addMember, changeRole, removeMember } from "@/lib/actions";
import { ROLE_INFO } from "@/lib/format";
import type { OrgRole } from "@/lib/types";
import { input } from "./styles";
import { RoleSelect } from "./role-select";
import { ActionForm, SubmitButton } from "./ui";

const ORG_ROLE_OPTIONS = (["owner", "member", "viewer"] as const).map(
  (role) => ({ value: role, label: ROLE_INFO[role].label }),
);

export function MemberRole({
  orgId,
  userId,
  role,
  name,
}: {
  orgId: string;
  userId: string;
  role: OrgRole;
  name: string;
}) {
  return (
    <RoleSelect
      value={role}
      options={ORG_ROLE_OPTIONS}
      label={`Role for ${name}`}
      onSave={(next) => changeRole(orgId, userId, next)}
    />
  );
}

export function RemoveMember({
  orgId,
  userId,
  name,
  self,
}: {
  orgId: string;
  userId: string;
  name: string;
  self: boolean;
}) {
  return (
    <ActionForm
      action={async () => removeMember(orgId, userId)}
      confirm={
        self
          ? "Leave this organization?"
          : `Remove ${name} from this organization?`
      }
    >
      <SubmitButton variant="ghost">{self ? "Leave" : "Remove"}</SubmitButton>
    </ActionForm>
  );
}

export function InviteMember({ orgId }: { orgId: string }) {
  return (
    <ActionForm
      action={addMember.bind(null, orgId)}
      className="flex flex-wrap items-start gap-3"
    >
      <label className="min-w-56 flex-1">
        <span className="sr-only">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="Email of a registered user"
          className={input}
        />
      </label>
      <label>
        <span className="sr-only">Role</span>
        <select name="role" defaultValue="member" className={`${input} w-36`}>
          {ORG_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton>Add member</SubmitButton>
    </ActionForm>
  );
}
