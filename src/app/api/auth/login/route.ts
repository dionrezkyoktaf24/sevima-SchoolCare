import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api/response";
import { createSessionToken, getConfiguredTppkCredentials, TPPK_SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Format data login tidak valid.", 400);
    }

    const parsed =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const username = typeof parsed.username === "string" ? parsed.username.trim() : "";
    const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
    const password = typeof parsed.password === "string" ? parsed.password : "";

    const credentials = getConfiguredTppkCredentials();
    const normalizedUsername = username || email;

    if (
      normalizedUsername !== credentials.username ||
      password !== credentials.password
    ) {
      return errorResponse("UNAUTHORIZED", "Email atau password tidak valid.", 401);
    }

    const sessionToken = createSessionToken(credentials.username);
    const response = successResponse(
      {
        authenticated: true,
        username: credentials.username,
      },
      200
    );

    response.cookies.set({
      name: TPPK_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return errorResponse("INTERNAL_SERVER_ERROR", "Terjadi kesalahan saat login.", 500);
  }
}
