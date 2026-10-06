import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/bar-chart";
import { Gauge } from "@/components/gauge";
import { PageHeader } from "@/components/page-header";
import { DeviceStatus } from "@/components/status";
import { badge, card, cardTitle, surface } from "@/components/styles";
import { TypeIcon } from "@/components/type-icon";
import { AutoRefresh } from "@/components/ui";
import { api } from "@/lib/api";
import { requireOrg } from "@/lib/context";
import { DEVICE_TYPES, deviceName, isSupported, timeAgo } from "@/lib/format";
import type { ActivityDay, Device } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

const dayLabel = (iso: string, long = false) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(
    "en-GB",
    long
      ? { weekday: "short", day: "numeric", month: "short" }
      : { day: "numeric", month: "short" },
  );

function Change({ today, yesterday }: { today: number; yesterday: number }) {
  if (!yesterday)
    return (
      <span className="text-xs text-muted">
        {today ? "none yesterday" : "no activity yet"}
      </span>
    );
  const pct = ((today - yesterday) / yesterday) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-good" : "text-bad"}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? "+" : ""}
      {pct.toFixed(1)}%{" "}
      <span className="font-normal text-muted">vs yesterday</span>
    </span>
  );
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { org } = await requireOrg();
  const days = (await searchParams).days === "30" ? 30 : 7;
  const [allDevices, activity] = await Promise.all([
    api<Device[]>(`/orgs/${org.id}/devices`),
    api<ActivityDay[]>(`/orgs/${org.id}/activity?days=${days}`),
  ]);
  const devices = allDevices.filter((d) => isSupported(d.typeKey));
  const online = devices.filter((d) => d.online).length;
  const syncing = devices.filter((d) => d.syncing).length;
  const [yesterday, today] = activity.slice(-2).map((d) => d.commands);

  const byLocation = Object.entries(
    devices.reduce<Record<string, number>>((acc, d) => {
      const key = d.location?.name ?? "No location";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <AutoRefresh seconds={10} />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section
            className={`${card} grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-line`}
            aria-label="Summary"
          >
            <div>
              <p className="text-sm text-brand-600">Total devices</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {devices.length}
              </p>
              <p className="mt-1 text-xs text-muted">
                {devices.filter((d) => d.typeKey === "fanled").length} fan ·{" "}
                {devices.filter((d) => d.typeKey === "rgb_bar").length} bar
                light
              </p>
            </div>
            <div className="sm:pl-6">
              <p className="text-sm text-brand-600">Online now</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{online}</p>
              <p className="mt-1 text-xs text-muted">
                {devices.length - online} offline
              </p>
            </div>
            <div className="sm:pl-6">
              <p className="text-sm text-brand-600">Commands today</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {today ?? 0}
              </p>
              <p className="mt-1">
                <Change today={today ?? 0} yesterday={yesterday ?? 0} />
              </p>
            </div>
          </section>

          <section className={card} aria-labelledby="activity-title">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="activity-title" className={cardTitle}>
                  Device activity
                </h2>
                <p className="text-xs text-muted">Commands sent per day</p>
              </div>
              <nav
                className="inline-flex rounded-xl border border-line bg-cream p-1 text-sm"
                aria-label="Range"
              >
                {[7, 30].map((d) => (
                  <Link
                    key={d}
                    href={`/dashboard?days=${d}`}
                    aria-current={days === d ? "page" : undefined}
                    className={`rounded-lg px-3 py-1 ${days === d ? "bg-white font-medium text-brand-700 shadow-sm" : "text-muted hover:text-ink"}`}
                  >
                    {d === 7 ? "Weekly" : "Monthly"}
                  </Link>
                ))}
              </nav>
            </div>
            <BarChart
              unit="Commands per day"
              bars={activity.map((d) => ({
                key: d.day,
                label:
                  days === 7
                    ? new Date(`${d.day}T00:00:00`).toLocaleDateString(
                        "en-GB",
                        { weekday: "short" },
                      )
                    : dayLabel(d.day),
                value: d.commands,
                detail: `${dayLabel(d.day, true)} · ${d.commands} command${d.commands === 1 ? "" : "s"}${d.failed ? ` (${d.failed} failed)` : ""}`,
              }))}
            />
          </section>

          <section
            className={`${surface} overflow-x-auto`}
            aria-labelledby="devices-title"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 id="devices-title" className={cardTitle}>
                Devices
              </h2>
              <Link
                href="/devices"
                className="text-sm text-brand-700 hover:underline"
              >
                View all
              </Link>
            </div>
            <table className="mt-3 w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-brand-600">
                  <th className="px-5 py-3 font-medium">Device</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Location</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Last seen
                  </th>
                </tr>
              </thead>
              <tbody>
                {devices.slice(0, 6).map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-line last:border-0 hover:bg-cream/60"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/devices/${device.id}`}
                        className="font-medium hover:text-brand-700"
                      >
                        {deviceName(device)}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      <span className="inline-flex items-center gap-2">
                        <TypeIcon
                          typeKey={device.typeKey}
                          className="h-4 w-4 text-brand-600"
                        />
                        {
                          DEVICE_TYPES[
                            device.typeKey as keyof typeof DEVICE_TYPES
                          ]
                        }
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted">
                      {device.location?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <DeviceStatus device={device} />
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      {timeAgo(device.lastSeenAt)}
                    </td>
                  </tr>
                ))}
                {!devices.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-8 text-center text-muted"
                    >
                      No devices yet.{" "}
                      <Link
                        href="/devices?claim=1"
                        className="text-brand-700 hover:underline"
                      >
                        Claim your first device
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

        <div className="space-y-6">
          <section className={card} aria-labelledby="online-title">
            <h2 id="online-title" className={cardTitle}>
              Online now
            </h2>
            <div className="mt-4">
              <Gauge
                value={devices.length ? (online / devices.length) * 100 : 0}
                label="of devices online"
              />
            </div>
            <p className="mt-3 text-center text-sm text-muted">
              {devices.length
                ? online === devices.length
                  ? "Every device is reporting in."
                  : `${devices.length - online} device${devices.length - online === 1 ? " hasn't" : "s haven't"} reported recently.`
                : "Claim a device to see it here."}
            </p>
            <div className="mt-5 grid grid-cols-2 divide-x divide-line border-t border-line pt-4 text-center">
              <div>
                <p className="text-sm text-brand-600">Online</p>
                <p className="text-2xl font-bold tabular-nums">{online}</p>
              </div>
              <div>
                <p className="text-sm text-brand-600">Syncing</p>
                <p className="text-2xl font-bold tabular-nums">{syncing}</p>
              </div>
            </div>
          </section>

          <section className={card} aria-labelledby="locations-title">
            <div className="flex items-center justify-between">
              <h2 id="locations-title" className={cardTitle}>
                By location
              </h2>
              <span className={badge.brand}>{org.name}</span>
            </div>
            <ul className="mt-4 space-y-3">
              {byLocation.map(([name, count]) => (
                <li key={name}>
                  <div className="flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="text-muted tabular-nums">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-brand-50">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${(count / devices.length) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
              {!byLocation.length && (
                <li className="text-sm text-muted">No devices yet.</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
