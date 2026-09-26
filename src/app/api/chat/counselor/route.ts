import { NextRequest } from "next/server";
import { counselorMessageSchema, getCounselorMessagesQuerySchema } from "@/lib/validation/chat";
import { chatService } from "@/server/services/chat.service";
import { errorResponse, handleApiError, successResponse } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sseHub } from "@/server/realtime/sse-hub";
import { verifyInternalCounselorAccess } from "@/server/auth/guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/counselor?report_id=...
 * Internal endpoint for counselors to view message history of a report.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = verifyInternalCounselorAccess(request);
    if (!auth.authorized) {
      return errorResponse("UNAUTHORIZED", auth.reason ?? "Akses tidak diizinkan.", 401);
    }

    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`chat:counselor:get:${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak permintaan pesan. Silakan tunggu sebentar.",
        429
      );
    }

    const reportIdParam = request.nextUrl.searchParams.get("report_id");
    if (!reportIdParam) {
      return errorResponse("VALIDATION_ERROR", "Parameter 'report_id' wajib disertakan.", 400);
    }

    const validation = getCounselorMessagesQuerySchema.safeParse({ report_id: reportIdParam });
    if (!validation.success) {
      return errorResponse("VALIDATION_ERROR", "Format report_id harus berupa UUID yang valid.", 400);
    }

    const messages = await chatService.getMessagesByReportId(validation.data.report_id);
    return successResponse({ messages }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/chat/counselor
 * Internal endpoint for counselors to send a message to the reporting student.
 * Requires internal counselor authorization; rejects student tokens.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify internal counselor authorization
    const auth = verifyInternalCounselorAccess(request);
    if (!auth.authorized) {
      return errorResponse("UNAUTHORIZED", auth.reason ?? "Akses tidak diizinkan.", 401);
    }

    // 2. Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`chat:counselor:post:${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak pengiriman pesan. Silakan tunggu sebentar.",
        429
      );
    }

    // 3. Safe JSON parsing
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return handleApiError(parseError);
    }

    // 4. Validate input
    const validatedData = counselorMessageSchema.parse(body);

    // 5. Store message in PostgreSQL (sender_role is hardcoded to COUNSELOR)
    const result = await chatService.createCounselorMessage(
      validatedData.report_id,
      validatedData.message
    );

    // 6. Realtime notification over SSE (post-commit, non-fatal if publish fails)
    try {
      sseHub.publishNewMessage(result.report_id, {
        id: result.id,
        sender_role: result.sender_role,
        message: result.message,
        created_at: result.created_at,
      });
    } catch {
      console.error("Non-fatal SSE publish failure for new_message");
    }

    return successResponse(
      {
        id: result.id,
        sender_role: result.sender_role,
        message: result.message,
        created_at: result.created_at,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
