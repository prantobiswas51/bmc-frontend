import { CircleCheck, CircleDashed, RefreshCw } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { Device } from "@/lib/types";
import { badge } from "./styles";

/** Online/offline + syncing, with icon and text (never colour alone). */
export function DeviceStatus({
  device,
}: {
  device: Pick<Device, "online" | "syncing" | "lastSeenAt">;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {device.online ? (
        <span className={badge.good}>
          <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Online
        </span>
      ) : (
        <span
          className={badge.neutral}
          title={`Last seen ${timeAgo(device.lastSeenAt)}`}
        >
          <CircleDashed className="h-3.5 w-3.5" aria-hidden /> Offline
        </span>
      )}
      {device.syncing && (
        <span className={badge.brand}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Syncing
        </span>
      )}
    </span>
  );
}
