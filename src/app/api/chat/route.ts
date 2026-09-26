import { NextRequest } from "next/server";
import { studentMessageSchema, getStudentMessagesQuerySchema } from "@/lib/validation/chat";
import { chatService } from "@/server/services/chat.service";
import { errorResponse, handleApiError, successResponse } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { sseHub } from "@/server/realtime/sse-hub";
import { verifyInternalCounselorAccess } from "@/server/auth/guard";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat?token=CARE-XXXX-XXXX
 * Retrieves chronological messages belonging only to the authenticated report.
 * Also supports counselor retrieval via ?report_id=... with internal Bearer authorization.
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`chat:get:${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak permintaan pesan. Silakan tunggu sebentar.",
        429
      );
    }

    const tokenParam = request.nextUrl.searchParams.get("token");
    const reportIdParam = request.nextUrl.searchParams.get("report_id");

    // 1. If student token is provided
    if (tokenParam) {
      const validation = getStudentMessagesQuerySchema.safeParse({ token: tokenParam });
      if (!validation.success) {
        return errorResponse(
          "NOT_FOUND",
          "Laporan tidak ditemukan atau format kode tiket tidak valid.",
          404
        );
      }

      const messages = await chatService.getMessagesBySecretToken(validation.data.token);
      return successResponse({ messages }, 200);
    }

    // 2. If counselor report_id is provided
    if (reportIdParam) {
      const auth = verifyInternalCounselorAccess(request);
      if (!auth.authorized) {
        return errorResponse("UNAUTHORIZED", auth.reason ?? "Akses tidak diizinkan.", 401);
      }

      const uuidCheck = z.string().uuid().safeParse(reportIdParam);
      if (!uuidCheck.success) {
        return errorResponse("VALIDATION_ERROR", "Format report_id harus berupa UUID yang valid.", 400);
      }

      const messages = await chatService.getMessagesByReportId(uuidCheck.data);
      return successResponse({ messages }, 200);
    }

    // 3. Neither provided
    return errorResponse("VALIDATION_ERROR", "Parameter 'token' wajib disertakan.", 400);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/chat
 * Student sends a private message to counselors regarding their report.
 * Authenticated strictly via secret ticket token.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`chat:post:${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak pengiriman pesan. Silakan tunggu sebentar.",
        429
      );
    }

    // Safe JSON parsing
    let body: unknown;
    try {
      body = await request.json();
    } catch (parseError) {
      return handleApiError(parseError);
    }

    // Validate student input
    const validatedData = studentMessageSchema.parse(body);

    // Save message in PostgreSQL first (sender_role is hardcoded to STUDENT)
    const result = await chatService.createStudentMessage(
      validatedData.token,
      validatedData.message
    );

    // Realtime notification over SSE (post-commit, non-fatal if publish fails)
    try {
      sseHub.publishNewMessage(result.report_id, {
        id: result.id,
        sender_role: result.sender_role,
        message: result.message,
        created_at: result.created_at,
      });
    } catch {
      // Diagnostic only; message remains safely stored in PostgreSQL
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
