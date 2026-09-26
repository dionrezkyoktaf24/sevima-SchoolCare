import { NextRequest } from "next/server";
import { isValidTokenFormat } from "@/lib/security/token";

export interface AuthGuardResult {
  authorized: boolean;
  reason?: string;
}

/**
 * MVP Server-Side Authorization Guard for Internal/TPPK operations.
 * 
 * Rules:
 * 1. Strictly rejects student secret tokens (CARE-XXXX-XXXX) from performing privileged mutations.
 * 2. Checks internal token against SESSION_SECRET for MVP internal access.
 * 3. Provides clean extension point for Phase 5 session/cookie authentication.
 */
export function verifyInternalCounselorAccess(request: NextRequest): AuthGuardResult {
  const authHeader = request.headers.get("authorization");
  const internalKey = request.headers.get("x-internal-key");

  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (internalKey) {
    token = internalKey.trim();
  }

  // 1. If student attempts to use their secret ticket token, reject immediately
  if (token && isValidTokenFormat(token)) {
    return {
      authorized: false,
      reason: "Kode tiket siswa tidak memiliki otorisasi untuk mengubah status laporan.",
    };
  }

  // 2. Validate against SESSION_SECRET for internal MVP requests
  const sessionSecret = process.env.SESSION_SECRET;
  if (!token || !sessionSecret || token !== sessionSecret) {
    return {
      authorized: false,
      reason: "Akses ditolak: Diperlukan otorisasi internal petugas TPPK/BK.",
    };
  }

  return { authorized: true };
}
