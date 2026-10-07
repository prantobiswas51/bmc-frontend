"use client";

import { Trash2, Wand2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import {
  type ActionState,
  deleteDevice,
  nextHardwareId,
  provisionDevice,
} from "@/lib/actions";
import type { DeviceType } from "@/lib/types";
import { button, input, label } from "./styles";
import { FormError, SecretValue, SubmitButton } from "./ui";

export function ProvisionForm({ types }: { types: DeviceType[] }) {
  const [state, action] = useActionState(provisionDevice, null);
  const [typeKey, setTypeKey] = useState(types[0]?.key ?? "");
  const [hardwareId, setHardwareId] = useState("");
  /** True while the field holds a generated ID, so changing type regenerates it. */
  const [generated, setGenerated] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generating, startGenerate] = useTransition();
  const prefix = types.find((t) => t.key === typeKey)?.idPrefix;

  const generate = (key: string) =>
    startGenerate(async () => {
      const result = await nextHardwareId(key);
      setGenerateError(result.error ?? "");
      if (result.hardwareId) {
        setHardwareId(result.hardwareId);
        setGenerated(true);
      }
    });

  // A successful provision clears the field for the next device.
  const [lastSecret, setLastSecret] = useState(state?.secret);
  if (state?.secret !== lastSecret) {
    setLastSecret(state?.secret);
    if (state?.secret) {
      setHardwareId("");
      setGenerated(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        action={action}
        className="grid gap-4 md:grid-cols-[200px_1fr_auto] md:items-end"
      >
        <label className={label}>
          <span>Type</span>
          <select
            name="typeKey"
            value={typeKey}
            onChange={(e) => {
              setTypeKey(e.target.value);
              if (generated) generate(e.target.value);
            }}
            className={input}
          >
            {types.map((type) => (
              <option key={type.key} value={type.key}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <div className={label}>
          <label htmlFor="hardwareId">Hardware ID</label>
          <div className="flex gap-2">
            <input
              id="hardwareId"
              name="hardwareId"
              required
              pattern="[A-Za-z0-9_\-]{3,64}"
              title="3-64 characters: letters, digits, _ and -"
              placeholder={prefix ? `${prefix}_00001` : "BM_DEVICE_00001"}
              value={hardwareId}
              onChange={(e) => {
                setHardwareId(e.target.value);
                setGenerated(false);
              }}
              className={`${input} font-mono`}
            />
            <button
              type="button"
              className={`${button.secondary} shrink-0`}
              disabled={!prefix || generating}
              title={prefix ? undefined : "This type has no ID prefix"}
              onClick={() => generate(typeKey)}
            >
              <Wand2 className="h-4 w-4" aria-hidden />
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
        <SubmitButton>Provision</SubmitButton>
      </form>
      <FormError state={generateError ? { error: generateError } : state} />
      {state?.secret && (
        <div
          className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"
          role="status"
        >
          <p className="text-sm font-medium text-brand-800">
            {state.secret.hardwareId} created. Copy both now — they are only
            shown once.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <SecretValue
              label="Device secret (flash into firmware)"
              value={state.secret.deviceSecret}
            />
            <SecretValue
              label="Claim code (print on label)"
              value={state.secret.claimCode}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Row action on the Provisioning table (super_admin). */
export function DeleteDeviceButton({
  id,
  hardwareId,
  orgName,
}: {
  id: string;
  hardwareId: string;
  orgName: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState>(null);
  const warning = orgName
    ? `Delete ${hardwareId}? It belongs to ${orgName} and disappears from their account, with its history and MQTT login. This can't be undone.`
    : `Delete ${hardwareId}? Its MQTT login and history go too. This can't be undone.`;
  return (
    <span className="inline-flex items-center gap-2">
      {result?.error && (
        <span role="alert" className="text-xs text-bad">
          {result.error}
        </span>
      )}
      <button
        type="button"
        disabled={pending}
        className={button.ghost}
        aria-label={`Delete ${hardwareId}`}
        onClick={() => {
          if (window.confirm(warning)) {
            startTransition(async () => setResult(await deleteDevice(id)));
          }
        }}
      >
        <Trash2 className="h-4 w-4 text-bad" aria-hidden />
      </button>
    </span>
  );
}
