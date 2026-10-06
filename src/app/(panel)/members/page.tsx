import type { Metadata } from "next";
import {
  InviteMember,
  MemberRole,
  RemoveMember,
} from "@/components/member-row-actions";
import { PageHeader } from "@/components/page-header";
import { badge, card, cardTitle, surface } from "@/components/styles";
import { api } from "@/lib/api";
import { can, requireOrg } from "@/lib/context";
import { ROLE_INFO } from "@/lib/format";
import type { Member } from "@/lib/types";

export const metadata: Metadata = { title: "Members & roles" };

export default async function MembersPage() {
  const { org, me } = await requireOrg();
  const members = await api<Member[]>(`/orgs/${org.id}/members`);
  const isOwner = can(org, "owner");

  return (
    <div className="space-y-6">
      <PageHeader title="Members & roles" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          {isOwner && (
            <section className={card} aria-labelledby="invite-title">
              <h2 id="invite-title" className={cardTitle}>
                Add someone to {org.name}
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                They need a BongoMaker Control account first.
              </p>
              <InviteMember orgId={org.id} />
            </section>
          )}

          <section
            className={`${surface} overflow-x-auto`}
            aria-labelledby="members-title"
          >
            <h2 id="members-title" className={`${cardTitle} px-5 pt-5`}>
              Members
            </h2>
            <table className="mt-3 w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-brand-600">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const self = member.userId === me.id;
                  return (
                    <tr
                      key={member.userId}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium">
                          {member.user.name}{" "}
                          {self && <span className={badge.neutral}>you</span>}
                        </p>
                        <p className="text-xs text-muted">
                          {member.user.email}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        {isOwner ? (
                          <MemberRole
                            orgId={org.id}
                            userId={member.userId}
                            role={member.role}
                            name={member.user.name}
                          />
                        ) : (
                          <span
                            className={
                              member.role === "owner"
                                ? badge.brand
                                : badge.neutral
                            }
                          >
                            {ROLE_INFO[member.role].label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(isOwner || self) && (
                          <RemoveMember
                            orgId={org.id}
                            userId={member.userId}
                            name={member.user.name}
                            self={self}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>

        <section className={card} aria-labelledby="roles-title">
          <h2 id="roles-title" className={cardTitle}>
            Roles
          </h2>
          <dl className="mt-4 space-y-4 text-sm">
            {(
              ["owner", "member", "viewer", "super_admin", "developer"] as const
            ).map((role) => (
              <div key={role}>
                <dt className="flex items-center gap-2 font-medium">
                  {ROLE_INFO[role].label}
                  <span
                    className={
                      ROLE_INFO[role].scope === "Platform"
                        ? badge.brand
                        : badge.neutral
                    }
                  >
                    {ROLE_INFO[role].scope}
                  </span>
                </dt>
                <dd className="mt-1 text-muted">{ROLE_INFO[role].can}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Platform roles belong to BongoMaker staff and are granted by a super
            admin.
          </p>
        </section>
      </div>
    </div>
  );
}
