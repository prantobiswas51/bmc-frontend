import { CircleCheck, CircleX } from "lucide-react";
import type { Metadata } from "next";
import { CreateMqttUserForm, MqttUserActions } from "@/components/mqtt-admin";
import { PageHeader } from "@/components/page-header";
import {
  badge,
  button,
  card,
  cardTitle,
  input,
  surface,
} from "@/components/styles";
import { api } from "@/lib/api";
import { requireStaff } from "@/lib/context";
import { timeAgo } from "@/lib/format";
import type { MqttBroker, MqttUser } from "@/lib/types";

export const metadata: Metadata = { title: "MQTT users" };

const ACCESS_LABEL = {
  read: "read",
  write: "write",
  readwrite: "read + write",
} as const;

export default async function MqttUsersPage({
  searchParams,
}: PageProps<"/admin/mqtt">) {
  const { me } = await requireStaff("super_admin", "developer");
  const params = await searchParams;
  const kind =
    params.kind === "device" || params.kind === "client" ? params.kind : "";
  const search = typeof params.search === "string" ? params.search : "";
  const query = new URLSearchParams({
    ...(kind && { kind }),
    ...(search && { search }),
  });
  const [broker, users] = await Promise.all([
    api<MqttBroker>("/admin/mqtt"),
    api<MqttUser[]>(`/admin/mqtt-users?${query}`),
  ]);
  const canEdit = me.platformRole === "super_admin";

  return (
    <div className="space-y-6">
      <PageHeader title="MQTT users" />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className={card} aria-labelledby="broker-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="broker-title" className={cardTitle}>
                Broker
              </h2>
              <p className="mt-1 text-sm text-muted">{broker.integration}</p>
            </div>
            {broker.connected ? (
              <span className={badge.good}>
                <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Backend
                connected
              </span>
            ) : (
              <span className={badge.bad}>
                <CircleX className="h-3.5 w-3.5" aria-hidden /> Backend not
                connected
              </span>
            )}
          </div>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted">URL</dt>
              <dd className="mt-1 font-mono">
                {broker.url || "MQTT disabled"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Topic prefix</dt>
              <dd className="mt-1 font-mono">{broker.topicPrefix}/</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Backend account</dt>
              <dd className="mt-1 font-mono">
                {broker.serviceUsername ?? "—"}{" "}
                <span className="font-sans text-xs text-muted">
                  (env, superuser)
                </span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
            Accounts below are stored in Postgres and checked by the broker
            through <code>{broker.hooks.auth}</code>,{" "}
            <code>{broker.hooks.superuser}</code> and{" "}
            <code>{broker.hooks.acl}</code>. The broker caches answers briefly,
            so changes apply within about a minute.
          </p>
        </section>

        <section className={card} aria-labelledby="device-acl-title">
          <h2 id="device-acl-title" className={cardTitle}>
            Device access
          </h2>
          <p className="mt-1 mb-3 text-sm text-muted">
            Every device account gets this, for its own ID (%u) only.
          </p>
          <ul className="space-y-1.5 text-sm">
            {broker.deviceAcl.map((rule) => (
              <li
                key={rule.topic}
                className="flex items-center justify-between gap-3"
              >
                <code className="truncate">{rule.topic}</code>
                <span
                  className={
                    rule.access === "read" ? badge.neutral : badge.brand
                  }
                >
                  {ACCESS_LABEL[rule.access]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {canEdit && (
        <details className={card}>
          <summary className="cursor-pointer list-none font-medium text-brand-600">
            + Add a client account
          </summary>
          <p className="mt-2 mb-4 text-sm text-muted">
            For dashboards, Node-RED, test tools or other services. Device
            accounts are created by provisioning.
          </p>
          <CreateMqttUserForm />
        </details>
      )}

      <section
        className={`${surface} overflow-x-auto`}
        aria-labelledby="accounts-title"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
          <h2 id="accounts-title" className={cardTitle}>
            Accounts{" "}
            <span className="text-sm font-normal text-muted">
              ({users.length})
            </span>
          </h2>
          <form className="flex flex-wrap gap-2" aria-label="Filter accounts">
            <label>
              <span className="sr-only">Search usernames</span>
              <input
                name="search"
                defaultValue={search}
                placeholder="Search username"
                className={`${input} w-48 py-1.5`}
              />
            </label>
            <label>
              <span className="sr-only">Kind</span>
              <select
                name="kind"
                defaultValue={kind}
                className={`${input} w-32 py-1.5`}
              >
                <option value="">All</option>
                <option value="device">Devices</option>
                <option value="client">Clients</option>
              </select>
            </label>
            <button type="submit" className={`${button.secondary} py-1.5`}>
              Filter
            </button>
          </form>
        </div>
        <table className="mt-3 w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-brand-600">
              <th className="px-5 py-3 font-medium">Username</th>
              <th className="px-3 py-3 font-medium">Kind</th>
              <th className="px-3 py-3 font-medium">Device / access</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Last login</th>
              {canEdit && (
                <th className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-line align-top last:border-0"
              >
                <td className="px-5 py-3 font-mono">{user.username}</td>
                <td className="px-3 py-3">
                  <span
                    className={
                      user.kind === "device" ? badge.neutral : badge.brand
                    }
                  >
                    {user.kind}
                  </span>
                  {user.superuser && (
                    <span className={`${badge.bad} ml-1`}>superuser</span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted">
                  {user.device ? (
                    <span>
                      {user.device.name ?? "Unnamed"} ·{" "}
                      {user.device.orgName ?? "not claimed"}
                    </span>
                  ) : user.superuser ? (
                    "All topics"
                  ) : user.acl.length ? (
                    <ul className="space-y-0.5">
                      {user.acl.map((rule) => (
                        <li key={rule.topic + rule.access}>
                          <code className="text-ink">{rule.topic}</code> ·{" "}
                          {ACCESS_LABEL[rule.access]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No access"
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className={user.enabled ? badge.good : badge.neutral}>
                    {user.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted">
                  {timeAgo(user.lastAuthAt)}
                </td>
                {canEdit && (
                  <td className="px-5 py-3 text-right">
                    <MqttUserActions user={user} />
                  </td>
                )}
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-muted">
                  No accounts match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
