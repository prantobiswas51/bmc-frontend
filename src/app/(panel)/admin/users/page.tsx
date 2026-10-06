import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { PlatformRoleSelect } from "@/components/platform-role-select";
import { badge, button, cardTitle, input, surface } from "@/components/styles";
import { api } from "@/lib/api";
import { requireStaff } from "@/lib/context";
import type { AdminUser } from "@/lib/types";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const { me } = await requireStaff("super_admin");
  const search =
    typeof (await searchParams).search === "string"
      ? String((await searchParams).search)
      : "";
  const users = await api<AdminUser[]>(
    `/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Users" />
      <section
        className={`${surface} overflow-x-auto`}
        aria-labelledby="users-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
          <div>
            <h2 id="users-title" className={cardTitle}>
              All users
            </h2>
            <p className="text-xs text-muted">
              Platform roles grant access across every organization.
              Organization roles are set per organization.
            </p>
          </div>
          <form className="flex gap-2" role="search">
            <label>
              <span className="sr-only">Search users</span>
              <input
                name="search"
                defaultValue={search}
                placeholder="Name or email"
                className={`${input} w-52 py-1.5`}
              />
            </label>
            <button type="submit" className={`${button.secondary} py-1.5`}>
              Search
            </button>
          </form>
        </div>
        <table className="mt-3 w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-brand-600">
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-3 py-3 text-right font-medium">
                Organizations
              </th>
              <th className="px-3 py-3 font-medium">Joined</th>
              <th className="px-5 py-3 font-medium">Platform role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium">
                    {user.name}{" "}
                    {user.id === me.id && (
                      <span className={badge.neutral}>you</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {user.orgCount}
                </td>
                <td className="px-3 py-3 text-muted">
                  {new Date(user.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-5 py-3">
                  <PlatformRoleSelect
                    userId={user.id}
                    role={user.platformRole}
                    name={user.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
