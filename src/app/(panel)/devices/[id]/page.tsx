import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FanLedControls, RgbBarControls } from "@/components/device-controls";
import { PageHeader } from "@/components/page-header";
import { ReleaseDevice } from "@/components/release-device";
import { DeviceStatus } from "@/components/status";
import { badge, card, cardTitle, input, label } from "@/components/styles";
import { TypeIcon } from "@/components/type-icon";
import { ActionForm, AutoRefresh, SubmitButton } from "@/components/ui";
import { updateDevice } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { can, requireOrg } from "@/lib/context";
import { DEVICE_TYPES, deviceName, isSupported, timeAgo } from "@/lib/format";
import type { Command, Device, Location, TelemetryPoint } from "@/lib/types";

export const metadata: Metadata = { title: "Device" };

const METRIC_LABELS: Record<string, string> = {
  rssi: "Wi-Fi signal (dBm)",
  rpm: "Fan speed (RPM)",
  tempC: "Temperature (°C)",
};

const STATUS_BADGE: Record<Command["status"], string> = {
  pending: badge.neutral,
  sent: badge.brand,
  succeeded: badge.good,
  failed: badge.bad,
  expired: badge.neutral,
};

export default async function DevicePage({
  params,
}: PageProps<"/devices/[id]">) {
  const { id } = await params;
  const { org, me } = await requireOrg();
  const device = await api<Device>(`/devices/${id}`).catch((error: unknown) => {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    )
      notFound();
    throw error;
  });
  if (!isSupported(device.typeKey)) notFound();

  const [commands, telemetry, locations] = await Promise.all([
    api<Command[]>(`/devices/${id}/commands`),
    api<TelemetryPoint[]>(`/devices/${id}/telemetry?bucket=1d`),
    api<Location[]>(`/orgs/${device.orgId}/locations`),
  ]);
  const metrics = telemetry.at(-1)?.metrics ?? {};
  // Staff may open another organization's device: super_admin acts as owner, developer reads.
  const superAdmin = me.platformRole === "super_admin";
  const sameOrg = device.orgId === org.id;
  const canControl = superAdmin || (sameOrg && can(org, "member"));
  const isOwner = superAdmin || (sameOrg && can(org, "owner"));

  return (
    <div className="space-y-6">
      <PageHeader title={deviceName(device)} />
      <AutoRefresh seconds={3} />
      <Link
        href="/devices"
        className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All devices
      </Link>

      <section className={`${card} flex flex-wrap items-center gap-4`}>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50">
          <TypeIcon
            typeKey={device.typeKey}
            className="h-7 w-7 text-brand-600"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-medium">{deviceName(device)}</p>
          <p className="text-sm text-muted">
            {DEVICE_TYPES[device.typeKey]} ·{" "}
            {device.location?.name ?? "No location"} ·{" "}
            <span className="font-mono">{device.hardwareId}</span>
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd className="mt-1">
              <DeviceStatus device={device} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Last seen</dt>
            <dd className="mt-1">{timeAgo(device.lastSeenAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Firmware</dt>
            <dd className="mt-1">{device.firmwareVersion ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_380px]">
        {device.typeKey === "fanled" ? (
          <FanLedControls device={device} canControl={canControl} />
        ) : (
          <RgbBarControls device={device} canControl={canControl} />
        )}

        <div className="space-y-6">
          <section className={card} aria-labelledby="telemetry-title">
            <h2 id="telemetry-title" className={cardTitle}>
              Readings today
            </h2>
            {Object.keys(metrics).length ? (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-brand-600">
                    <th className="py-2 font-medium">Metric</th>
                    <th className="py-2 text-right font-medium">Avg</th>
                    <th className="py-2 text-right font-medium">Min</th>
                    <th className="py-2 text-right font-medium">Max</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {Object.entries(metrics).map(([name, m]) => (
                    <tr key={name} className="border-t border-line">
                      <th scope="row" className="py-2 text-left font-normal">
                        {METRIC_LABELS[name] ?? name}
                      </th>
                      <td className="py-2 text-right">{m.avg.toFixed(1)}</td>
                      <td className="py-2 text-right text-muted">{m.min}</td>
                      <td className="py-2 text-right text-muted">{m.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-muted">
                No readings from this device today.
              </p>
            )}
          </section>

          <section className={card} aria-labelledby="history-title">
            <h2 id="history-title" className={cardTitle}>
              Recent commands
            </h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {commands.slice(0, 8).map((command) => (
                <li
                  key={command.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="font-medium">
                      {command.action.replace("_", " ")}
                    </span>
                    {typeof command.payload.effect === "string" && (
                      <span className="text-muted">
                        {" "}
                        · {command.payload.effect}
                      </span>
                    )}
                    <span className="block text-xs text-muted">
                      {timeAgo(command.createdAt)}
                    </span>
                  </span>
                  <span className={STATUS_BADGE[command.status]}>
                    {command.status}
                  </span>
                </li>
              ))}
              {!commands.length && (
                <li className="py-2 text-muted">Nothing sent yet.</li>
              )}
            </ul>
          </section>

          {isOwner && (
            <section
              className={`${card} space-y-4`}
              aria-labelledby="settings-title"
            >
              <h2 id="settings-title" className={cardTitle}>
                Settings
              </h2>
              <ActionForm
                action={updateDevice.bind(null, device.id)}
                className="space-y-3"
              >
                <label className={label}>
                  <span>Name</span>
                  <input
                    name="name"
                    required
                    maxLength={255}
                    defaultValue={device.name ?? ""}
                    className={input}
                  />
                </label>
                <label className={label}>
                  <span>Location</span>
                  <select
                    name="locationId"
                    defaultValue={device.locationId ?? ""}
                    className={input}
                  >
                    <option value="">No location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <SubmitButton variant="secondary">Save</SubmitButton>
              </ActionForm>
              <div className="border-t border-line pt-4">
                <ReleaseDevice deviceId={device.id} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
