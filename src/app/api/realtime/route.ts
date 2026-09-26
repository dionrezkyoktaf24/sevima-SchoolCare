import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { trackReportSchema } from "@/lib/validation/report";
import { sseHub } from "@/server/realtime/sse-hub";
import { errorResponse, handleApiError } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { randomUUID } from "node:crypto";
import { verifyInternalCounselorAccess } from "@/server/auth/guard";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/realtime?token=CARE-XXXX-XXXX
 * Server-Sent Events (SSE) endpoint allowing a student reporter to receive
 * real-time status updates without refreshing.
 * 
 * Strict Security:
 * - Authenticates ONLY via secret ticket token.
 * - Resolves reportId server-side; arbitrary report IDs are strictly impossible to subscribe to.
 * - Secret token is never reflected or exposed in the event stream.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting on connection attempts
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`sse:connect:${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak permintaan koneksi realtime. Silakan tunggu beberapa saat.",
        429
      );
    }

    // 2. Validate student token or counselor authorization
    const tokenParam = request.nextUrl.searchParams.get("token");
    const reportIdParam = request.nextUrl.searchParams.get("report_id");
    const cookieHeader = request.headers.get("cookie") ?? "";
    const hasSessionCookie = cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .some((entry) => entry.startsWith("schoolcare_tppk_session="));
    const hasAuthHeader = Boolean(
      request.headers.get("authorization") ||
        request.headers.get("x-internal-key") ||
        hasSessionCookie
    );

    let report: { id: string; status: string; updatedAt: Date } | null = null;

    if (hasAuthHeader && reportIdParam) {
      const auth = verifyInternalCounselorAccess(request);
      if (!auth.authorized) {
        return errorResponse("UNAUTHORIZED", auth.reason ?? "Akses tidak diizinkan.", 401);
      }

      const uuidCheck = z.string().uuid().safeParse(reportIdParam);
      if (!uuidCheck.success) {
        return errorResponse("VALIDATION_ERROR", "Format report_id harus berupa UUID yang valid.", 400);
      }

      report = await prisma.report.findUnique({
        where: { id: uuidCheck.data },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    } else {
      // Student connection must provide token
      if (!tokenParam) {
        return errorResponse("VALIDATION_ERROR", "Parameter 'token' wajib disertakan.", 400);
      }

      const validation = trackReportSchema.safeParse({ token: tokenParam });
      if (!validation.success) {
        return errorResponse(
          "NOT_FOUND",
          "Laporan tidak ditemukan atau format kode tiket tidak valid.",
          404
        );
      }

      const secretToken = validation.data.token;
      report = await prisma.report.findUnique({
        where: { secretToken },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    }

    if (!report) {
      return errorResponse(
        "NOT_FOUND",
        "Laporan tidak ditemukan atau format kode tiket tidak valid.",
        404
      );
    }

    // 4. Create readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let unsubscribe: (() => void) | null = null;
    let isClosed = false;
    let cleanup = () => {};

    const stream = new ReadableStream({
      start(controller) {
        cleanup = () => {
          if (isClosed) return;
          isClosed = true;

          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }

          try {
            controller.close();
          } catch {
            // ignore controller already closed
          }
        };

        const sendEvent = (event: string, data: unknown) => {
          if (isClosed) return;
          try {
            const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            cleanup();
          }
        };

        const sendComment = (comment: string) => {
          if (isClosed) return;
          try {
            const payload = `: ${comment}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            cleanup();
          }
        };

        // Subscribe client to sseHub
        const clientId = randomUUID();
        unsubscribe = sseHub.subscribe({
          id: clientId,
          reportId: report.id,
          send: sendEvent,
          sendComment,
          close: cleanup,
        });

        // Send initial state upon connection
        sendEvent("status_updated", {
          status: report.status,
          updated_at: report.updatedAt.toISOString(),
        });

        // Send heartbeat comment every 15 seconds to prevent idle proxy timeouts
        heartbeatTimer = setInterval(() => {
          sendComment("heartbeat");
        }, 15000);

        if (heartbeatTimer.unref) {
          heartbeatTimer.unref();
        }

        // Clean up when client disconnects
        request.signal.addEventListener("abort", () => {
          cleanup();
        });
      },

      cancel() {
        cleanup();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
