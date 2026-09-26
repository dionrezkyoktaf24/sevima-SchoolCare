import { NextRequest } from "next/server";
import { updateReportStatusSchema } from "@/lib/validation/report";
import { reportService } from "@/server/services/report.service";
import { errorResponse, handleApiError, successResponse } from "@/lib/api/response";
import { verifyInternalCounselorAccess } from "@/server/auth/guard";
import { sseHub } from "@/server/realtime/sse-hub";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/reports/status
 * Internal TPPK endpoint to update the triage status of an ongoing report.
 * Requires internal counselor authorization; rejects student tokens.
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Verify internal TPPK authorization
    const auth = verifyInternalCounselorAccess(request);
    if (!auth.authorized) {
      return errorResponse("UNAUTHORIZED", auth.reason ?? "Akses tidak diizinkan.", 401);
    }

    // 2. Safe JSON parsing
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return handleApiError(parseError);
    }

    // 3. Validate input payload
    const validatedData = updateReportStatusSchema.parse(body);

    // 4. Update status in database
    const result = await reportService.updateReportStatus(
      validatedData.report_id,
      validatedData.status
    );

    // 5. Publish real-time SSE event to subscribed students (guaranteed post-database commit)
    sseHub.publishStatusUpdate(result.report_id, result.status, result.updated_at);

    return successResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
