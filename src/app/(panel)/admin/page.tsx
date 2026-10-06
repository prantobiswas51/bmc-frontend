import type { Metadata } from "next";
import { Gauge } from "@/components/gauge";
import { PageHeader } from "@/components/page-header";
import { card, cardTitle, surface } from "@/components/styles";
import { api } from "@/lib/api";
import { requireStaff } from "@/lib/context";
import type { AdminStats } from "@/lib/types";

export const metadata: Metadata = { title: "Platform overview" };

interface AdminOrg {
  id: string;
  name: string;
  createdAt: string;
  memberCount: number;
  deviceCount: number;
}

export default async function AdminPage() {
  await requireStaff("super_admin", "developer");
  const [stats, orgs] = await Promise.all([
    api<AdminStats>("/admin/stats"),
    api<AdminOrg[]>("/admin/organizations"),
  ]);
  const tiles = [
    { label: "Users", value: stats.users, note: `${stats.staff} staff` },
    {
      label: "Organizations",
      value: stats.organizations,
      note: "client accounts",
    },
    {
      label: "Devices",
      value: stats.devices,
      note: `${stats.devices - stats.claimed} not claimed yet`,
    },
    {
      label: "Commands (24 h)",
      value: stats.commands24h,
      note: "across all devices",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Platform overview" />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section
            className={`${card} grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line`}
            aria-label="Totals"
          >
            {tiles.map((tile, i) => (
              <div key={tile.label} className={i ? "lg:pl-6" : ""}>
                <p className="text-sm text-brand-600">{tile.label}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">
                  {tile.value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted">{tile.note}</p>
              </div>
            ))}
          </section>
          <section
            className={`${surface} overflow-x-auto`}
            aria-labelledby="orgs-title"
          >
            <h2 id="orgs-title" className={`${cardTitle} px-5 pt-5`}>
              Organizations
            </h2>
            <table className="mt-3 w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-brand-600">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 text-right font-medium">Members</th>
                  <th className="px-3 py-3 text-right font-medium">Devices</th>
                  <th className="px-5 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-medium">{o.name}</td>
                    <td className="px-3 py-3 text-right">{o.memberCount}</td>
                    <td className="px-3 py-3 text-right">{o.deviceCount}</td>
                    <td className="px-5 py-3 text-right text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <section className={card} aria-labelledby="fleet-title">
          <h2 id="fleet-title" className={cardTitle}>
            Fleet online
          </h2>
          <div className="mt-4">
            <Gauge
              value={stats.devices ? (stats.online / stats.devices) * 100 : 0}
              label="of all devices online"
            />
          </div>
          <div className="mt-5 grid grid-cols-2 divide-x divide-line border-t border-line pt-4 text-center">
            <div>
              <p className="text-sm text-brand-600">Online</p>
              <p className="text-2xl font-bold tabular-nums">{stats.online}</p>
            </div>
            <div>
              <p className="text-sm text-brand-600">Claimed</p>
              <p className="text-2xl font-bold tabular-nums">{stats.claimed}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
