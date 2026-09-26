import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a standard JSON success response.
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Creates a standard JSON error response without exposing internal server secrets.
 */
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Safe error boundary for API route handlers.
 * Intercepts Prisma and Zod errors to guarantee no stack traces, paths, or secrets leak to the client.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const message = issue ? issue.message : "Data masukan tidak valid.";
    return errorResponse("VALIDATION_ERROR", message, 400, {
      field: issue?.path.join("."),
    });
  }

  // Handle Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorResponse("CONFLICT_ERROR", "Data dengan identitas tersebut sudah terdaftar.", 409);
    }
    if (error.code === "P2025") {
      return errorResponse("NOT_FOUND", "Data yang dicari tidak ditemukan.", 404);
    }
    // Generic Prisma database error: do not expose internal DB details
    return errorResponse("INTERNAL_SERVER_ERROR", "Terjadi kendala pada penyimpanan data.", 500);
  }

  // Handle malformed JSON
  if (error instanceof SyntaxError) {
    return errorResponse("VALIDATION_ERROR", "Format JSON dalam request body tidak valid.", 400);
  }

  // Handle service errors
  if (error && typeof error === "object" && "name" in error && error.name === "ReportServiceError") {
    const err = error as unknown as { code: string; message: string };
    if (err.code === "SCHOOL_NOT_FOUND" || err.code === "REPORT_NOT_FOUND") {
      return errorResponse("NOT_FOUND", err.message, 404);
    }
    return errorResponse("INTERNAL_SERVER_ERROR", err.message, 500);
  }

  // Handle operational errors
  if (process.env.NODE_ENV === "development") {
    console.error("[API_ERROR]", error);
  }

  return errorResponse("INTERNAL_SERVER_ERROR", "Terjadi kesalahan internal pada server.", 500);
}
