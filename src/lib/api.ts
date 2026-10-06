import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, apiUrl } from "./session";

// Server-only. Tokens live in httpOnly cookies; proxy.ts keeps the access token fresh.

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Pass "" for unauthenticated calls (login/register). */
  token?: string;
  headers?: Record<string, string>;
}

export async function api<T = void>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, token, headers: extra } = options;
  const bearer = token ?? (await cookies()).get(ACCESS_COOKIE)?.value;
  const forwardedFor = (await headers()).get("x-forwarded-for");

  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(bearer && { Authorization: `Bearer ${bearer}` }),
      ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 && token !== "") {
    redirect("/login?expired=1");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: string | string[];
      errors?: unknown;
    };
    const message =
      res.status === 429
        ? "Too many requests. Try again in a moment."
        : Array.isArray(data.message)
          ? data.message.join(", ")
          : (data.message ?? res.statusText);
    throw new ApiError(res.status, message, data.errors);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
