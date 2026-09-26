import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

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

function getCredentialStoreFilePath(): string {
  return path.join(process.cwd(), "data", "tppk-credentials.json");
}

async function readStoredTppkCredentials(): Promise<{ username: string; password: string } | null> {
  const filePath = getCredentialStoreFilePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<{ username?: string; password?: string }>;
    const username = normalizeCredentialValue(parsed.username);
    const password = normalizeCredentialValue(parsed.password);
    if (!username || !password) {
      return null;
    }
    return { username, password };
  } catch {
    return null;
  }
}

export async function getConfiguredTppkCredentials() {
  const envUsername = normalizeCredentialValue(process.env.TPPK_USERNAME);
  const envPassword = normalizeCredentialValue(process.env.TPPK_PASSWORD);

  if (envUsername && envPassword) {
    return { username: envUsername, password: envPassword };
  }

  const stored = await readStoredTppkCredentials();
  if (stored) {
    return stored;
  }

  return {
    username: DEFAULT_TPPK_USERNAME,
    password: DEFAULT_TPPK_PASSWORD,
  };
}

export async function registerTppkCredentials(input: {
  username?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}) {
  const username = normalizeCredentialValue(input.username);
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword = typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (!username) {
    throw new Error("Username wajib diisi.");
  }

  if (username.length < 3) {
    throw new Error("Username minimal 3 karakter.");
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  if (password !== confirmPassword) {
    throw new Error("Konfirmasi password tidak sesuai.");
  }

  const filePath = getCredentialStoreFilePath();
  const dirPath = path.dirname(filePath);
  await fs.mkdir(dirPath, { recursive: true });

  const credentials = {
    username,
    password,
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(filePath, JSON.stringify(credentials, null, 2), "utf8");
  return credentials;
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
