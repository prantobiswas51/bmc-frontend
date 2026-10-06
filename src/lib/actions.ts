"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "./api";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  cookieOptions,
  ORG_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "./session";
import type {
  AclRule,
  AuthTokens,
  DeviceState,
  OrgRole,
  PlatformRole,
  ProvisionedDevice,
} from "./types";

export type ActionState = {
  error?: string;
  ok?: boolean;
  values?: Record<string, string>;
  /** One-time secrets to show once (provisioning, released claim code). */
  secret?: Record<string, string>;
} | null;

const text = (form: FormData, key: string) =>
  String(form.get(key) ?? "").trim();
const optional = (form: FormData, key: string) => text(form, key) || undefined;

/** Runs API calls; returns the API's error message instead of throwing, then refreshes the page. */
async function attempt(call: () => Promise<unknown>): Promise<ActionState> {
  try {
    await call();
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error; // includes Next's redirect()
  }
  refresh();
  return { ok: true };
}

// --- session -----------------------------------------------------------------

async function startSession(tokens: AuthTokens) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(ACCESS_MAX_AGE));
  jar.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

async function authenticate(
  path: string,
  body: Record<string, string>,
): Promise<ActionState> {
  try {
    await startSession(
      await api<AuthTokens>(path, { method: "POST", body, token: "" }),
    );
  } catch (error) {
    if (error instanceof ApiError)
      return { error: error.message, values: { ...body, password: "" } };
    throw error;
  }
  redirect("/dashboard");
}

export async function login(_: ActionState, form: FormData) {
  return authenticate("/auth/login", {
    email: text(form, "email"),
    password: String(form.get("password") ?? ""),
  });
}

export async function register(_: ActionState, form: FormData) {
  return authenticate("/auth/register", {
    name: text(form, "name"),
    email: text(form, "email"),
    password: String(form.get("password") ?? ""),
  });
}

export async function logout() {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await api("/auth/logout", {
      method: "POST",
      body: { refreshToken },
      token: "",
    }).catch(() => {});
  }
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(ORG_COOKIE);
  redirect("/login");
}

// --- organizations -----------------------------------------------------------

export async function switchOrg(orgId: string) {
  (await cookies()).set(ORG_COOKIE, orgId, cookieOptions(REFRESH_MAX_AGE));
  refresh();
}

export async function createOrg(_: ActionState, form: FormData) {
  try {
    const org = await api<{ id: string }>("/orgs", {
      method: "POST",
      body: { name: text(form, "name") },
    });
    (await cookies()).set(ORG_COOKIE, org.id, cookieOptions(REFRESH_MAX_AGE));
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  redirect("/dashboard");
}

export async function addMember(orgId: string, _: ActionState, form: FormData) {
  return attempt(() =>
    api(`/orgs/${orgId}/members`, {
      method: "POST",
      body: { email: text(form, "email"), role: text(form, "role") as OrgRole },
    }),
  );
}

export async function changeRole(orgId: string, userId: string, role: OrgRole) {
  return attempt(() =>
    api(`/orgs/${orgId}/members/${userId}`, {
      method: "PATCH",
      body: { role },
    }),
  );
}

export async function removeMember(orgId: string, userId: string) {
  return attempt(() =>
    api(`/orgs/${orgId}/members/${userId}`, { method: "DELETE" }),
  );
}

export async function createLocation(
  orgId: string,
  _: ActionState,
  form: FormData,
) {
  return attempt(() =>
    api(`/orgs/${orgId}/locations`, {
      method: "POST",
      body: { name: text(form, "name") },
    }),
  );
}

export async function renameLocation(
  id: string,
  _: ActionState,
  form: FormData,
) {
  return attempt(() =>
    api(`/locations/${id}`, {
      method: "PATCH",
      body: { name: text(form, "name") },
    }),
  );
}

export async function deleteLocation(id: string) {
  return attempt(() => api(`/locations/${id}`, { method: "DELETE" }));
}

// --- devices -----------------------------------------------------------------

export async function claimDevice(
  orgId: string,
  _: ActionState,
  form: FormData,
) {
  const body = {
    hardwareId: text(form, "hardwareId"),
    claimCode: text(form, "claimCode"),
    name: text(form, "name"),
    locationId: optional(form, "locationId"),
  };
  const result = await attempt(() =>
    api(`/orgs/${orgId}/devices/claim`, { method: "POST", body }),
  );
  return result?.error
    ? { ...result, values: { ...body, locationId: body.locationId ?? "" } }
    : result;
}

export async function updateDevice(id: string, _: ActionState, form: FormData) {
  return attempt(() =>
    api(`/devices/${id}`, {
      method: "PATCH",
      body: {
        name: text(form, "name"),
        locationId: optional(form, "locationId") ?? null,
      },
    }),
  );
}

/** Owner: unclaim. The new claim code is returned once so it can be handed over. */
export async function releaseDevice(id: string): Promise<ActionState> {
  try {
    const { claimCode } = await api<{ claimCode: string }>(`/devices/${id}`, {
      method: "DELETE",
    });
    return { ok: true, secret: { claimCode } };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

/** Merge-patch desired state; the device converges to it (also after reconnecting). */
export async function setDeviceState(id: string, state: DeviceState) {
  return attempt(() =>
    api(`/devices/${id}/state`, { method: "PATCH", body: { state } }),
  );
}

/** One-shot action (effect, reboot). */
export async function sendCommand(
  id: string,
  action: string,
  payload: Record<string, unknown> = {},
) {
  return attempt(() =>
    api(`/devices/${id}/commands`, {
      method: "POST",
      body: { action, payload },
    }),
  );
}

// --- platform staff ----------------------------------------------------------

export async function setPlatformRole(
  userId: string,
  platformRole: PlatformRole | null,
) {
  return attempt(() =>
    api(`/admin/users/${userId}`, { method: "PATCH", body: { platformRole } }),
  );
}

export async function provisionDevice(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const device = await api<ProvisionedDevice>("/admin/devices", {
      method: "POST",
      body: {
        typeKey: text(form, "typeKey"),
        hardwareId: text(form, "hardwareId"),
      },
    });
    refresh();
    return {
      ok: true,
      secret: {
        hardwareId: device.hardwareId,
        deviceSecret: device.deviceSecret,
        claimCode: device.claimCode,
      },
    };
  } catch (error) {
    if (error instanceof ApiError)
      return {
        error: error.message,
        values: { hardwareId: text(form, "hardwareId") },
      };
    throw error;
  }
}

// --- MQTT users (super_admin) -------------------------------------------------

function aclFromForm(form: FormData): AclRule[] {
  const topics = form.getAll("topic").map(String);
  const access = form.getAll("access").map(String);
  return topics
    .map((topic, i) => ({
      topic: topic.trim(),
      access: access[i] as AclRule["access"],
    }))
    .filter((rule) => rule.topic);
}

export async function createMqttUser(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const { user, password } = await api<{
      user: { username: string };
      password: string;
    }>("/admin/mqtt-users", {
      method: "POST",
      body: {
        username: text(form, "username"),
        superuser: form.get("superuser") === "on",
        acl: aclFromForm(form),
      },
    });
    refresh();
    return { ok: true, secret: { username: user.username, password } };
  } catch (error) {
    if (error instanceof ApiError)
      return {
        error: error.message,
        values: { username: text(form, "username") },
      };
    throw error;
  }
}

export async function updateMqttAcl(
  id: string,
  _: ActionState,
  form: FormData,
) {
  return attempt(() =>
    api(`/admin/mqtt-users/${id}`, {
      method: "PATCH",
      body: {
        superuser: form.get("superuser") === "on",
        acl: aclFromForm(form),
      },
    }),
  );
}

export async function setMqttUserEnabled(id: string, enabled: boolean) {
  return attempt(() =>
    api(`/admin/mqtt-users/${id}`, { method: "PATCH", body: { enabled } }),
  );
}

export async function resetMqttPassword(id: string): Promise<ActionState> {
  try {
    const { password } = await api<{ password: string }>(
      `/admin/mqtt-users/${id}/password`,
      { method: "POST" },
    );
    return { ok: true, secret: { password } };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function deleteMqttUser(id: string) {
  return attempt(() => api(`/admin/mqtt-users/${id}`, { method: "DELETE" }));
}
