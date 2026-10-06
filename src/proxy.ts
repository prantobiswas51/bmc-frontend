import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  cookieOptions,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  refreshTokens,
} from "@/lib/session";

/**
 * Gate for the panel: no refresh cookie → login. A missing (expired) access cookie is
 * renewed here with the refresh token, and the new pair is forwarded to this request
 * and set on the response, so pages never see an expired session mid-use.
 */
export async function proxy(request: NextRequest) {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (request.cookies.has(ACCESS_COOKIE)) {
    return NextResponse.next();
  }

  const tokens = await refreshTokens(
    refresh,
    request.headers.get("x-forwarded-for"),
  );
  if (!tokens) {
    const response = NextResponse.redirect(
      new URL("/login?expired=1", request.url),
    );
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }
  request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    cookieOptions(ACCESS_MAX_AGE),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    cookieOptions(REFRESH_MAX_AGE),
  );
  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/devices/:path*",
    "/locations/:path*",
    "/members/:path*",
    "/admin/:path*",
  ],
};
