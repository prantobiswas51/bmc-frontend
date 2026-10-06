import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ClaimDeviceForm } from "@/components/claim-device-form";
import { PageHeader } from "@/components/page-header";
import { QuickToggle } from "@/components/quick-toggle";
import { DeviceStatus } from "@/components/status";
import { button, card, input } from "@/components/styles";
import { TypeIcon } from "@/components/type-icon";
import { AutoRefresh } from "@/components/ui";
import { api } from "@/lib/api";
import { can, requireOrg } from "@/lib/context";
import { DEVICE_TYPES, deviceName, isSupported } from "@/lib/format";
import type { Device, Location } from "@/lib/types";

export const metadata: Metadata = { title: "Devices" };

function summary(device: Device): string {
  const s = device.desiredState;
  if (device.typeKey === "fanled") {
    return `Fan ${s.speed ? `${s.speed}%` : "off"} · Light ${s.light ? "on" : "off"}`;
  }
  if (!s.on) return "Off";
  return s.mode === "white"
    ? `White ${s.colorTemp ?? 4000} K · ${s.brightness ?? 80}%`
    : `Colour · ${s.brightness ?? 80}%`;
}

export default async function DevicesPage({
  searchParams,
}: PageProps<"/devices">) {
  const { org } = await requireOrg();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const type =
    typeof params.type === "string" && isSupported(params.type)
      ? params.type
      : "";
  const locationId = typeof params.location === "string" ? params.location : "";

  const query = new URLSearchParams({
    ...(type && { type }),
    ...(locationId && { locationId }),
  });
  const [all, locations] = await Promise.all([
    api<Device[]>(`/orgs/${org.id}/devices?${query}`),
    api<Location[]>(`/orgs/${org.id}/locations`),
  ]);
  const devices = all.filter(
    (d) =>
      isSupported(d.typeKey) &&
      (!q ||
        deviceName(d).toLowerCase().includes(q) ||
        d.hardwareId.toLowerCase().includes(q)),
  );
  const isOwner = can(org, "owner");
  const canControl = can(org, "member");

  return (
    <div className="space-y-6">
      <PageHeader title="Devices" />
      <AutoRefresh seconds={10} />

      {isOwner && (
        <details className={`${card} group`} open={params.claim === "1"}>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-brand-600">
            <Plus
              className="h-5 w-5 transition group-open:rotate-45"
              aria-hidden
            />
            Claim a device
          </summary>
          <p className="mt-2 mb-4 text-sm text-muted">
            The hardware ID and the single-use claim code are on the device
            label.
          </p>
          <ClaimDeviceForm orgId={org.id} locations={locations} />
        </details>
      )}

      <form
        className="flex flex-wrap items-end gap-3"
        aria-label="Filter devices"
      >
        <label className="min-w-48 flex-1 space-y-1 text-xs text-muted">
          <span>Search</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Name or hardware ID"
            className={input}
          />
        </label>
        <label className="space-y-1 text-xs text-muted">
          <span>Type</span>
          <select name="type" defaultValue={type} className={input}>
            <option value="">All types</option>
            {Object.entries(DEVICE_TYPES).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          <span>Location</span>
          <select name="location" defaultValue={locationId} className={input}>
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={button.secondary}>
          Apply
        </button>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {devices.map((device) => {
          const toggleField = device.typeKey === "fanled" ? "light" : "on";
          return (
            <li key={device.id} className={`${card} flex flex-col gap-4`}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50">
                  <TypeIcon
                    typeKey={device.typeKey}
                    className="h-5 w-5 text-brand-600"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/devices/${device.id}`}
                    className="block truncate font-medium hover:text-brand-700"
                  >
                    {deviceName(device)}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {DEVICE_TYPES[device.typeKey as keyof typeof DEVICE_TYPES]}{" "}
                    · {device.location?.name ?? "No location"}
                  </p>
                </div>
                <QuickToggle
                  deviceId={device.id}
                  field={toggleField}
                  value={Boolean(device.desiredState[toggleField])}
                  label={`${deviceName(device)} ${toggleField === "on" ? "power" : "light"}`}
                  disabled={!canControl}
                />
              </div>
              <p className="text-sm">{summary(device)}</p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <DeviceStatus device={device} />
                <Link
                  href={`/devices/${device.id}`}
                  className="text-sm text-brand-700 hover:underline"
                >
                  Open
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      {!devices.length && (
        <p className={`${card} text-center text-sm text-muted`}>
          {all.length ? "No devices match these filters." : "No devices yet."}
        </p>
      )}
    </div>
  );
}
