"use client";

import { useActionState } from "react";
import { provisionDevice } from "@/lib/actions";
import { DEVICE_TYPES } from "@/lib/format";
import { input, label } from "./styles";
import { FormError, SecretValue, SubmitButton } from "./ui";

export function ProvisionForm() {
  const [state, action] = useActionState(provisionDevice, null);
  return (
    <div className="space-y-4">
      <form
        action={action}
        className="grid gap-4 md:grid-cols-[200px_1fr_auto] md:items-end"
      >
        <label className={label}>
          <span>Type</span>
          <select name="typeKey" className={input}>
            {Object.entries(DEVICE_TYPES).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          <span>Hardware ID</span>
          <input
            name="hardwareId"
            required
            pattern="[A-Za-z0-9_\-]{3,64}"
            title="3-64 characters: letters, digits, _ and -"
            placeholder="BM_FANLED_0001"
            defaultValue={state?.values?.hardwareId}
            className={`${input} font-mono`}
          />
        </label>
        <SubmitButton>Provision</SubmitButton>
      </form>
      <FormError state={state} />
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
