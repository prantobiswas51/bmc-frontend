"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { releaseDevice, type ActionState } from "@/lib/actions";
import { button } from "./styles";
import { SecretValue } from "./ui";

/** Owner: remove the device from the organization; shows the new claim code once. */
export function ReleaseDevice({ deviceId }: { deviceId: string }) {
  const [result, setResult] = useState<ActionState>(null);
  const [pending, startTransition] = useTransition();

  if (result?.secret?.claimCode) {
    return (
      <div className="space-y-3" role="status">
        <p className="text-sm">
          Device removed. Give this new claim code to whoever claims it next —
          it won&apos;t be shown again.
        </p>
        <SecretValue label="New claim code" value={result.secret.claimCode} />
        <Link href="/devices" className={button.secondary}>
          Back to devices
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        className={button.danger}
        onClick={() => {
          if (
            window.confirm(
              "Remove this device? Everyone loses access and its settings are cleared.",
            )
          ) {
            startTransition(async () =>
              setResult(await releaseDevice(deviceId)),
            );
          }
        }}
      >
        {pending ? "Removing…" : "Remove device"}
      </button>
      {result?.error && (
        <p role="alert" className="text-sm text-bad">
          {result.error}
        </p>
      )}
    </div>
  );
}
