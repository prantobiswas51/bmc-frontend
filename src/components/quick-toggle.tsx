"use client";

import { useOptimistic, useTransition } from "react";
import { setDeviceState } from "@/lib/actions";
import { Switch } from "./ui";

/** Power (bar light) or light (fan+LED) toggle on a device card. */
export function QuickToggle({
  deviceId,
  field,
  value,
  label,
  disabled,
}: {
  deviceId: string;
  field: string;
  value: boolean;
  label: string;
  disabled: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, startTransition] = useTransition();
  return (
    <Switch
      checked={optimistic}
      label={label}
      disabled={disabled}
      onChange={(next) =>
        startTransition(async () => {
          setOptimistic(next);
          await setDeviceState(deviceId, { [field]: next });
        })
      }
    />
  );
}
