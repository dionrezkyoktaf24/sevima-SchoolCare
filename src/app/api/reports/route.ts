import { NextRequest } from "next/server";
import { createReportSchema } from "@/lib/validation/report";
import { reportService } from "@/server/services/report.service";
import { errorResponse, handleApiError, successResponse } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/reports
 * Creates a new violence report without requiring student personal identity.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`reports:create:${clientIp}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak permintaan pembuatan laporan. Silakan coba kembali dalam beberapa saat.",
        429
      );
    }

    // 2. Safe JSON parsing
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return handleApiError(parseError);
    }

    // 3. Strict server-side Zod validation
    const validatedData = createReportSchema.parse(body);

    // 4. Persistence via Service Layer
    const result = await reportService.createReport(validatedData);

    return successResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
