import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { DeleteDeviceButton, ProvisionForm } from "@/components/provision-form";
import { DeviceStatus } from "@/components/status";
import {
  badge,
  button,
  card,
  cardTitle,
  input,
  surface,
} from "@/components/styles";
import { api } from "@/lib/api";
import { requireStaff } from "@/lib/context";
import { timeAgo } from "@/lib/format";
import type { AdminDevice, DeviceType } from "@/lib/types";

export const metadata: Metadata = { title: "Provisioning" };

export default async function ProvisioningPage({
  searchParams,
}: PageProps<"/admin/devices">) {
  const { me } = await requireStaff("super_admin", "developer");
  const canDelete = me.platformRole === "super_admin";
  const params = await searchParams;
  const status =
    params.status === "claimed" || params.status === "unclaimed"
      ? params.status
      : "";
  const search = typeof params.search === "string" ? params.search : "";
  const query = new URLSearchParams({
    ...(status && { status }),
    ...(search && { search }),
  });
  const [devices, types] = await Promise.all([
    api<AdminDevice[]>(`/admin/devices?${query}`),
    api<DeviceType[]>("/device-types"),
  ]);
  const typeName = new Map(types.map((t) => [t.key, t.name]));

  return (
    <div className="space-y-6">
      <PageHeader title="Provisioning" />
      <section className={card} aria-labelledby="provision-title">
        <h2 id="provision-title" className={cardTitle}>
          Provision a device
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Creates the device record before it ships. The MQTT username is the
          hardware ID.
        </p>
        <ProvisionForm types={types} />
      </section>

      <section
        className={`${surface} overflow-x-auto`}
        aria-labelledby="fleet-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
          <h2 id="fleet-title" className={cardTitle}>
            All devices
          </h2>
          <form
            className="flex flex-wrap items-end gap-2"
            aria-label="Filter devices"
          >
            <label>
              <span className="sr-only">Search by hardware ID</span>
              <input
                name="search"
                defaultValue={search}
                placeholder="Search hardware ID"
                className={`${input} w-44 py-1.5`}
              />
            </label>
            <label>
              <span className="sr-only">Status</span>
              <select
                name="status"
                defaultValue={status}
                className={`${input} w-36 py-1.5`}
              >
                <option value="">All</option>
                <option value="unclaimed">Not claimed</option>
                <option value="claimed">Claimed</option>
              </select>
            </label>
            <button type="submit" className={`${button.secondary} py-1.5`}>
              Filter
            </button>
          </form>
        </div>
        <table className="mt-3 w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-brand-600">
              <th className="px-5 py-3 font-medium">Hardware ID</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Organization</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Firmware</th>
              <th className="px-5 py-3 text-right font-medium">Last seen</th>
              {canDelete && (
                <th className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-mono">{d.hardwareId}</td>
                <td className="px-3 py-3 text-muted">
                  {typeName.get(d.typeKey) ?? d.typeKey}
                </td>
                <td className="px-3 py-3">
                  {d.orgName ?? (
                    <span className={badge.neutral}>Not claimed</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <DeviceStatus device={d} />
                </td>
                <td className="px-3 py-3 text-muted">
                  {d.firmwareVersion ?? "—"}
                </td>
                <td className="px-5 py-3 text-right text-muted">
                  {timeAgo(d.lastSeenAt)}
                </td>
                {canDelete && (
                  <td className="px-5 py-1 text-right">
                    <DeleteDeviceButton
                      id={d.id}
                      hardwareId={d.hardwareId}
                      orgName={d.orgName}
                    />
                  </td>
                )}
              </tr>
            ))}
            {!devices.length && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                  No devices match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
