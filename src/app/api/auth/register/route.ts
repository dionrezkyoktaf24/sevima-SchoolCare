import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api/response";
import { registerTppkCredentials } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Format data register tidak valid.", 400);
    }

    const parsed = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const username = typeof parsed.username === "string" ? parsed.username.trim() : "";
    const password = typeof parsed.password === "string" ? parsed.password : "";
    const confirmPassword = typeof parsed.confirmPassword === "string" ? parsed.confirmPassword : "";

    try {
      await registerTppkCredentials({ username, password, confirmPassword });
    } catch (registerError) {
      const message = registerError instanceof Error ? registerError.message : "Registrasi gagal.";
      return errorResponse("VALIDATION_ERROR", message, 400);
    }

    return successResponse(
      {
        registered: true,
        username,
      },
      200
    );
  } catch {
    return errorResponse("INTERNAL_SERVER_ERROR", "Terjadi kesalahan saat registrasi.", 500);
  }
}
