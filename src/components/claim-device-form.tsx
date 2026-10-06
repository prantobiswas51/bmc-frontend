"use client";

import { useActionState } from "react";
import { claimDevice } from "@/lib/actions";
import type { Location } from "@/lib/types";
import { input, label } from "./styles";
import { FormError, SubmitButton } from "./ui";

export function ClaimDeviceForm({
  orgId,
  locations,
}: {
  orgId: string;
  locations: Location[];
}) {
  const [state, action] = useActionState(claimDevice.bind(null, orgId), null);
  const values: Record<string, string> = state?.values ?? {};
  return (
    // key: remount after a failed attempt so defaultValues restore the input
    <form
      key={JSON.stringify(values)}
      action={action}
      className="grid gap-4 md:grid-cols-2"
    >
      <label className={label}>
        <span>Hardware ID</span>
        <input
          name="hardwareId"
          required
          maxLength={64}
          placeholder="BM_FANLED_0001"
          defaultValue={values.hardwareId}
          className={input}
        />
      </label>
      <label className={label}>
        <span>Claim code</span>
        <input
          name="claimCode"
          required
          maxLength={32}
          placeholder="XXXX-XXXX"
          autoComplete="off"
          defaultValue={values.claimCode}
          className={`${input} uppercase`}
        />
      </label>
      <label className={label}>
        <span>Name</span>
        <input
          name="name"
          required
          maxLength={255}
          placeholder="Desk fan"
          defaultValue={values.name}
          className={input}
        />
      </label>
      <label className={label}>
        <span>Location</span>
        <select
          name="locationId"
          defaultValue={values.locationId ?? ""}
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
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <SubmitButton>Claim device</SubmitButton>
        <FormError state={state} />
        {state?.ok && (
          <p role="status" className="text-sm text-good">
            Device added.
          </p>
        )}
      </div>
    </form>
  );
}
