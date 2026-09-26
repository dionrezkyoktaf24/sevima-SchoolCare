import { prisma } from "@/lib/db/prisma";
import { generateSecretToken } from "@/lib/security/token";
import type { CreateReportInput } from "@/lib/validation/report";
import { Prisma, type ReportStatus } from "@prisma/client";

export class ReportServiceError extends Error {
  constructor(
    public code: "SCHOOL_NOT_FOUND" | "REPORT_NOT_FOUND" | "TOKEN_COLLISION_EXHAUSTED",
    message: string
  ) {
    super(message);
    this.name = "ReportServiceError";
  }
}

export interface CreatedReportResult {
  report_id: string;
  secret_token: string;
  status: ReportStatus;
  created_at: string;
}

export interface TrackedReportResult {
  report_id: string;
  status: ReportStatus;
  severity: string;
  category: string;
  incident_location: string;
  incident_time: string | null;
  description: string;
  evidence_url: string | null;
  school: {
    id: string;
    name: string;
    city: string;
  };
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    sender: string;
    message: string;
    created_at: string;
  }>;
}

export interface UpdatedStatusResult {
  report_id: string;
  status: ReportStatus;
  updated_at: string;
}

/**
 * Service handling all core business logic for reports.
 * Acts as the clean boundary between HTTP handlers and database persistence.
 */
export class ReportService {
  /**
   * Creates a new report without requiring student personal identity.
   * Generates a cryptographically secure secret token server-side.
   */
  async createReport(input: CreateReportInput): Promise<CreatedReportResult> {
    // 1. Verify that the referenced school exists
    const school = await prisma.school.findUnique({
      where: { id: input.school_id },
      select: { id: true },
    });

    if (!school) {
      throw new ReportServiceError(
        "SCHOOL_NOT_FOUND",
        `Sekolah dengan ID '${input.school_id}' tidak terdaftar dalam sistem.`
      );
    }

    // 2. Insert with collision retry loop for secret_token
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const secretToken = generateSecretToken();

      try {
        const report = await prisma.report.create({
          data: {
            schoolId: input.school_id,
            secretToken,
            category: input.category,
            incidentLocation: input.incident_location,
            incidentTime: input.incident_time,
            description: input.description,
            evidenceUrl: input.evidence_url,
            status: "RECEIVED",
            aiSeverity: "MEDIUM",
          },
          select: {
            id: true,
            secretToken: true,
            status: true,
            createdAt: true,
          },
        });

        return {
          report_id: report.id,
          secret_token: report.secretToken,
          status: report.status,
          created_at: report.createdAt.toISOString(),
        };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          // Token collision (extremely rare with 32-bit cryptographically secure entropy), retry
          continue;
        }
        throw error;
      }
    }

    throw new ReportServiceError(
      "TOKEN_COLLISION_EXHAUSTED",
      "Gagal menghasilkan tiket laporan yang unik. Silakan coba lagi."
    );
  }

  /**
   * Retrieves a report strictly by secret ticket token.
   * Excludes sensitive internal reasoning (AI drafts, confidence, audit trails).
   */
  async getReportBySecretToken(token: string): Promise<TrackedReportResult | null> {
    const report = await prisma.report.findUnique({
      where: { secretToken: token },
      select: {
        id: true,
        status: true,
        aiSeverity: true,
        category: true,
        incidentLocation: true,
        incidentTime: true,
        description: true,
        evidenceUrl: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        messages: {
          select: {
            id: true,
            sender: true,
            message: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!report) {
      return null;
    }

    return {
      report_id: report.id,
      status: report.status,
      severity: report.aiSeverity,
      category: report.category,
      incident_location: report.incidentLocation,
      incident_time: report.incidentTime,
      description: report.description,
      evidence_url: report.evidenceUrl,
      school: report.school,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
      messages: report.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        message: m.message,
        created_at: m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Updates report status. Intended for counselor / TPPK internal workflow.
   */
  async updateReportStatus(
    reportId: string,
    status: ReportStatus
  ): Promise<UpdatedStatusResult> {
    const existing = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (!existing) {
      throw new ReportServiceError(
        "REPORT_NOT_FOUND",
        "Laporan yang dituju tidak ditemukan."
      );
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      report_id: updated.id,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    };
  }
}

export const reportService = new ReportService();
