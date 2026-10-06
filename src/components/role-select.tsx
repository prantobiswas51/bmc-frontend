"use client";

import { useState, useTransition } from "react";
import type { ActionState } from "@/lib/actions";
import { input } from "./styles";

/** A role dropdown that saves on change and reverts on error. */
export function RoleSelect<T extends string>({
  value,
  options,
  label,
  onSave,
  disabled,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  label: string;
  onSave: (value: T) => Promise<ActionState>;
  disabled?: boolean;
}) {
  const [current, setCurrent] = useState(value);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <select
        aria-label={label}
        value={current}
        disabled={disabled || pending}
        onChange={(event) => {
          const next = event.target.value as T;
          setCurrent(next);
          startTransition(async () => {
            const result = await onSave(next);
            setError(result?.error);
            if (result?.error) setCurrent(value);
          });
        }}
        className={`${input} w-36 py-1.5`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 max-w-48 text-xs text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
