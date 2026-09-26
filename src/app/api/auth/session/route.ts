import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api/response";
import { getSessionFromCookie, TPPK_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${TPPK_SESSION_COOKIE}=`));

    if (!match) {
      return errorResponse("UNAUTHORIZED", "Sesi tidak valid atau telah berakhir.", 401);
    }

    const rawToken = match.split("=")[1];
    const payload = verifySessionToken(rawToken);
    if (!payload) {
      return errorResponse("UNAUTHORIZED", "Sesi tidak valid atau telah berakhir.", 401);
    }

    const fallbackSession = await getSessionFromCookie();
    if (!fallbackSession || fallbackSession.username !== payload.username) {
      return errorResponse("UNAUTHORIZED", "Sesi tidak valid atau telah berakhir.", 401);
    }

    return successResponse(
      {
        authenticated: true,
        username: payload.username,
        expires_at: new Date(payload.exp).toISOString(),
      },
      200
    );
  } catch {
    return errorResponse("INTERNAL_SERVER_ERROR", "Gagal memvalidasi sesi.", 500);
  }
}
