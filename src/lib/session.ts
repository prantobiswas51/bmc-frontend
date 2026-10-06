// Shared by proxy.ts, server components and server actions (no next/headers here).

export const ACCESS_COOKIE = "bm_access";
export const REFRESH_COOKIE = "bm_refresh";
export const ORG_COOKIE = "bm_org";

const secure = process.env.NODE_ENV === "production";

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

/** Access token cookie lives a bit shorter than the JWT; refresh matches REFRESH_TOKEN_TTL_DAYS. */
export const ACCESS_MAX_AGE = 14 * 60;
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

// The API runs beside the panel (loopback) in dev and on the VPS; override with API_URL.
const API_URL = process.env.API_URL || "http://127.0.0.1:4000";
export const apiUrl = (path: string) => `${API_URL}/api/v1${path}`;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Exchanges a refresh token; null if it's invalid, expired or reused. */
export async function refreshTokens(
  refreshToken: string,
  forwardedFor?: string | null,
): Promise<TokenPair | null> {
  const res = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  return res.ok ? ((await res.json()) as TokenPair) : null;
}
