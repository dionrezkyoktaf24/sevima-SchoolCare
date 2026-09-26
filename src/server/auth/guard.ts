import { NextRequest } from "next/server";
import { isValidTokenFormat } from "@/lib/security/token";
import { TPPK_SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export interface AuthGuardResult {
  authorized: boolean;
  reason?: string;
}

/**
 * MVP Server-Side Authorization Guard for Internal/TPPK operations.
 *
 * Rules:
 * 1. Strictly rejects student secret tokens (CARE-XXXX-XXXX) from privileged mutations.
 * 2. Allows internal session cookies issued to authenticated TPPK/BK users.
 * 3. Falls back to the existing SESSION_SECRET bearer/x-internal-key check for server-to-server flows.
 */
export function verifyInternalCounselorAccess(request: NextRequest): AuthGuardResult {
  const authHeader = request.headers.get("authorization");
  const internalKey = request.headers.get("x-internal-key");
  const cookieHeader = request.headers.get("cookie") ?? "";

  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (internalKey) {
    token = internalKey.trim();
  }

  if (token && isValidTokenFormat(token)) {
    return {
      authorized: false,
      reason: "Kode tiket siswa tidak memiliki otorisasi untuk mengubah status laporan.",
    };
  }

  if (token) {
    const sessionSecret = process.env.SESSION_SECRET;
    if (sessionSecret && token === sessionSecret) {
      return { authorized: true };
    }
  }

  const sessionCookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${TPPK_SESSION_COOKIE}=`));

  if (sessionCookie) {
    const rawToken = sessionCookie.split("=")[1];
    if (rawToken && verifySessionToken(rawToken)) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    reason: "Akses ditolak: Diperlukan otorisasi internal petugas TPPK/BK.",
  };
}
