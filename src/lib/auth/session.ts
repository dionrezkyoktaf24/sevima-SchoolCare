import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const TPPK_SESSION_COOKIE = "schoolcare_tppk_session";
export const DEFAULT_TPPK_USERNAME = "admin";
export const DEFAULT_TPPK_PASSWORD = "schoolcare-2026";

export interface TppkSessionPayload {
  username: string;
  exp: number;
}

function getSessionSecret(): string {
  return process.env.SESSION_SECRET ?? "default-secret-key-min-16-chars-long";
}

function normalizeCredentialValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getConfiguredTppkCredentials() {
  return {
    username: normalizeCredentialValue(process.env.TPPK_USERNAME) || DEFAULT_TPPK_USERNAME,
    password: normalizeCredentialValue(process.env.TPPK_PASSWORD) || DEFAULT_TPPK_PASSWORD,
  };
}

export function createSessionToken(username: string): string {
  const payload: TppkSessionPayload = {
    username,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };

  const json = JSON.stringify(payload);
  const encodedPayload = Buffer.from(json, "utf8").toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(json)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): TppkSessionPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expectedSignature = createHmac("sha256", getSessionSecret())
      .update(json)
      .digest("base64url");

    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (actual.length !== expected.length) {
      return null;
    }

    if (!timingSafeEqual(actual, expected)) {
      return null;
    }

    const payload = JSON.parse(json) as TppkSessionPayload;
    if (!payload.username || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getSessionFromCookie(): Promise<TppkSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(TPPK_SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return null;
  }

  return verifySessionToken(sessionToken) ?? null;
}
