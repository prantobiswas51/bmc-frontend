"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions";
import { button, type ButtonVariant } from "./styles";

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={button[variant]}>
      {pending ? "Working…" : children}
    </button>
  );
}

export function FormError({ state }: { state: ActionState }) {
  return state?.error ? (
    <p role="alert" className="text-sm text-bad">
      {state.error}
    </p>
  ) : null;
}

/** A form bound to a server action: shows its error, optionally asks to confirm first. */
export function ActionForm({
  action,
  confirm,
  className,
  children,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  confirm?: string;
  className?: string;
  children: ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
      <FormError state={state} />
    </form>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-brand-600" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`}
      />
    </button>
  );
}

/** Re-renders the server components every `seconds` so live device state stays current. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}

/** Shows a one-time secret with a copy button. */
export function SecretValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-cream px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate font-mono text-sm text-ink">{value}</p>
      </div>
      <button
        type="button"
        className={button.ghost}
        aria-label={`Copy ${label}`}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
