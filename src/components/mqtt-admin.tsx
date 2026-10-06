"use client";

import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import {
  type ActionState,
  createMqttUser,
  deleteMqttUser,
  resetMqttPassword,
  setMqttUserEnabled,
  updateMqttAcl,
} from "@/lib/actions";
import type { AclRule, MqttUser } from "@/lib/types";
import { button, input, label } from "./styles";
import { FormError, SecretValue, SubmitButton, Switch } from "./ui";

const ACCESS: Array<{ value: AclRule["access"]; label: string }> = [
  { value: "read", label: "Read (subscribe)" },
  { value: "write", label: "Write (publish)" },
  { value: "readwrite", label: "Read + write" },
];

/** Rows of topic filter + access, submitted as repeated `topic` / `access` fields. */
function AclEditor({ initial }: { initial: AclRule[] }) {
  const [rules, setRules] = useState<Array<AclRule & { key: number }>>(
    (initial.length ? initial : [{ topic: "", access: "read" as const }]).map(
      (r, key) => ({ ...r, key }),
    ),
  );
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">Access rules</legend>
      <p className="text-xs text-muted">
        Topic filters may use <code>+</code> (one level) and <code>#</code> (the
        rest), plus <code>%u</code> (username) and <code>%c</code> (client id).
      </p>
      {rules.map((rule, i) => (
        <div key={rule.key} className="flex flex-wrap gap-2">
          <label className="min-w-56 flex-1">
            <span className="sr-only">Topic filter {i + 1}</span>
            <input
              name="topic"
              defaultValue={rule.topic}
              placeholder="devices/+/telemetry"
              maxLength={255}
              className={`${input} font-mono`}
            />
          </label>
          <label>
            <span className="sr-only">Access {i + 1}</span>
            <select
              name="access"
              defaultValue={rule.access}
              className={`${input} w-44`}
            >
              {ACCESS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={button.ghost}
            aria-label={`Remove rule ${i + 1}`}
            onClick={() =>
              setRules((current) => current.filter((r) => r.key !== rule.key))
            }
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        className={button.ghost}
        onClick={() =>
          setRules((current) => [
            ...current,
            { topic: "", access: "read", key: Date.now() },
          ])
        }
      >
        <Plus className="h-4 w-4" aria-hidden /> Add rule
      </button>
    </fieldset>
  );
}

export function CreateMqttUserForm() {
  const [state, action] = useActionState(createMqttUser, null);
  return (
    <div className="space-y-4">
      {/* key: start a fresh form after each successful create */}
      <form
        key={state?.secret?.username ?? "new"}
        action={action}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
          <label className={`${label} min-w-56 flex-1`}>
            <span>Username</span>
            <input
              name="username"
              required
              pattern="[A-Za-z0-9_\-]{3,64}"
              title="3-64 characters: letters, digits, _ and -"
              placeholder="nodered"
              defaultValue={state?.error ? state.values?.username : ""}
              className={`${input} font-mono`}
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="superuser"
              className="h-4 w-4 accent-brand-600"
            />
            Superuser (skips all access rules)
          </label>
        </div>
        <AclEditor initial={[]} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Create MQTT user</SubmitButton>
          <FormError state={state} />
        </div>
      </form>
      {state?.secret && (
        <div
          className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50 p-4"
          role="status"
        >
          <p className="text-sm font-medium text-brand-800">
            {state.secret.username} created. Copy the password now — it
            won&apos;t be shown again.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <SecretValue label="Username" value={state.secret.username} />
            <SecretValue label="Password" value={state.secret.password} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Enable switch, reset password, edit rules and delete for one MQTT account. */
export function MqttUserActions({ user }: { user: MqttUser }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState>(null);
  const [editing, setEditing] = useState(false);
  const [aclState, aclAction] = useActionState(
    updateMqttAcl.bind(null, user.id),
    null,
  );
  const isDevice = user.kind === "device";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Switch
          checked={user.enabled}
          label={`${user.username} enabled`}
          disabled={pending}
          onChange={(enabled) =>
            startTransition(async () =>
              setResult(await setMqttUserEnabled(user.id, enabled)),
            )
          }
        />
        <button
          type="button"
          disabled={pending}
          className={button.ghost}
          onClick={() => {
            const warning = isDevice
              ? `Reset the device secret for ${user.username}? The device can't connect until its firmware gets the new secret.`
              : `Reset the password for ${user.username}? Anything using the old one stops connecting.`;
            if (window.confirm(warning))
              startTransition(async () =>
                setResult(await resetMqttPassword(user.id)),
              );
          }}
        >
          <KeyRound className="h-4 w-4" aria-hidden /> Reset
        </button>
        {!isDevice && (
          <>
            <button
              type="button"
              className={button.ghost}
              aria-expanded={editing}
              onClick={() => setEditing((v) => !v)}
            >
              Rules
            </button>
            <button
              type="button"
              disabled={pending}
              className={button.ghost}
              aria-label={`Delete ${user.username}`}
              onClick={() => {
                if (window.confirm(`Delete MQTT user ${user.username}?`)) {
                  startTransition(async () =>
                    setResult(await deleteMqttUser(user.id)),
                  );
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-bad" aria-hidden />
            </button>
          </>
        )}
      </div>
      {result?.error && (
        <p role="alert" className="text-right text-sm text-bad">
          {result.error}
        </p>
      )}
      {result?.secret?.password && (
        <div className="text-left" role="status">
          <SecretValue
            label={
              isDevice
                ? "New device secret (shown once)"
                : "New password (shown once)"
            }
            value={result.secret.password}
          />
        </div>
      )}
      {editing && (
        <form
          action={aclAction}
          className="space-y-3 rounded-xl border border-line bg-cream p-3 text-left"
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="superuser"
              defaultChecked={user.superuser}
              className="h-4 w-4 accent-brand-600"
            />
            Superuser
          </label>
          <AclEditor initial={user.acl} />
          <div className="flex items-center gap-3">
            <SubmitButton variant="secondary">Save rules</SubmitButton>
            <FormError state={aclState} />
            {aclState?.ok && <span className="text-sm text-good">Saved</span>}
          </div>
        </form>
      )}
    </div>
  );
}
