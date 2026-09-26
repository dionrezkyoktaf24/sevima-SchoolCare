import { NextRequest } from "next/server";
import { trackReportSchema } from "@/lib/validation/report";
import { reportService } from "@/server/services/report.service";
import { errorResponse, handleApiError, successResponse } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports/track?token=CARE-XXXX-XXXX
 * Allows a student reporter to securely track their report status using their secret token.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`reports:track:${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak permintaan pelacakan laporan. Silakan tunggu sebentar.",
        429
      );
    }

    // 2. Extract and validate token
    const tokenParam = request.nextUrl.searchParams.get("token");
    if (!tokenParam || tokenParam.trim() === "") {
      return errorResponse("VALIDATION_ERROR", "Parameter 'token' wajib disertakan.", 400);
    }

    const validation = trackReportSchema.safeParse({ token: tokenParam });
    if (!validation.success) {
      // Return generic safe response without revealing pattern details
      return errorResponse(
        "NOT_FOUND",
        "Laporan tidak ditemukan atau format kode tiket tidak valid.",
        404
      );
    }

    const token = validation.data.token;

    // 3. Retrieve report data
    const report = await reportService.getReportBySecretToken(token);

    if (!report) {
      return errorResponse(
        "NOT_FOUND",
        "Laporan tidak ditemukan atau format kode tiket tidak valid.",
        404
      );
    }

    return successResponse(report, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
