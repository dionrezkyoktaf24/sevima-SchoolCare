import { NextRequest } from "next/server";
import { aiTriageService } from "@/server/services/ai-triage.service";
import { errorResponse, handleApiError, successResponse } from "@/lib/api/response";
import { verifyInternalCounselorAccess } from "@/server/auth/guard";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/reports/[reportId]/triage
 * Internal TPPK/BK endpoint to run server-side Gemini AI triage on an existing report.
 * Strictly pulls report data from PostgreSQL; rejects client-supplied report overrides.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    // 1. Verify internal TPPK authorization (student tokens strictly rejected)
    const auth = verifyInternalCounselorAccess(request);
    if (!auth.authorized) {
      return errorResponse("UNAUTHORIZED", auth.reason ?? "Akses tidak diizinkan.", 401);
    }

    // 2. Validate route parameter
    const { reportId } = await params;
    if (!reportId || !UUID_REGEX.test(reportId)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Parameter reportId harus berupa UUID yang valid.",
        400
      );
    }

    // 3. Process-local abuse protection rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`triage:${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak permintaan analisis AI. Silakan tunggu beberapa saat.",
        429
      );
    }

    // 4. Run AI triage pipeline (fetches report from DB, calls Gemini, validates with Zod, and persists)
    const result = await aiTriageService.runTriage(reportId);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
