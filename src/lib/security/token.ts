import { randomBytes } from "node:crypto";

/**
 * Ticket Token Format: CARE-XXXX-XXXX
 * - Cryptographically secure random generation using Node's crypto.randomBytes
 * - Never uses Math.random()
 * - Unpredictable with high entropy
 * - Must NOT be printed or exposed to server logs
 */
const TOKEN_REGEX = /^CARE-[0-9A-F]{4}-[0-9A-F]{4}$/i;

/**
 * Generates a cryptographically secure secret ticket token.
 * Example output: CARE-8F2A-99BC
 */
export function generateSecretToken(): string {
  const bytes = randomBytes(4);
  const part1 = bytes.subarray(0, 2).toString("hex").toUpperCase();
  const part2 = bytes.subarray(2, 4).toString("hex").toUpperCase();
  return `CARE-${part1}-${part2}`;
}

/**
 * Validates whether a token matches the expected CARE-XXXX-XXXX format.
 */
export function isValidTokenFormat(token: unknown): token is string {
  if (typeof token !== "string") {
    return false;
  }
  return TOKEN_REGEX.test(token.trim());
}

/**
 * Masks a token for safe operational logging without exposing the full bearer secret.
 * Example: CARE-8F2A-99BC -> CARE-****-99BC
 */
export function maskToken(token: string): string {
  if (!isValidTokenFormat(token)) {
    return "CARE-****-****";
  }
  const parts = token.trim().toUpperCase().split("-");
  return `${parts[0]}-****-${parts[2]}`;
}
