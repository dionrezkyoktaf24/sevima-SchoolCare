import { prisma } from "@/lib/db/prisma";

export class ChatServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

export interface ChatMessageResult {
  id: string;
  sender_role: "STUDENT" | "COUNSELOR";
  message: string;
  created_at: string;
}

export interface CreatedMessageResult {
  id: string;
  report_id: string;
  sender_role: "STUDENT" | "COUNSELOR";
  message: string;
  created_at: string;
}

export class ChatService {
  /**
   * Retrieves all messages for a specific report identified by the student secret token.
   * Messages are ordered chronologically (oldest to newest).
   */
  async getMessagesBySecretToken(token: string): Promise<ChatMessageResult[]> {
    const report = await prisma.report.findUnique({
      where: { secretToken: token },
      select: { id: true },
    });

    if (!report) {
      throw new ChatServiceError(
        "NOT_FOUND",
        "Laporan tidak ditemukan atau format kode tiket tidak valid.",
        404
      );
    }

    const messages = await prisma.reportMessage.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sender: true,
        message: true,
        createdAt: true,
      },
    });

    return messages.map((m) => ({
      id: m.id,
      sender_role: m.sender,
      message: m.message,
      created_at: m.createdAt.toISOString(),
    }));
  }

  /**
   * Retrieves all messages for a report by report_id UUID.
   * For authorized counselors only.
   */
  async getMessagesByReportId(reportId: string): Promise<ChatMessageResult[]> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (!report) {
      throw new ChatServiceError(
        "NOT_FOUND",
        "Laporan yang dituju tidak ditemukan.",
        404
      );
    }

    const messages = await prisma.reportMessage.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sender: true,
        message: true,
        createdAt: true,
      },
    });

    return messages.map((m) => ({
      id: m.id,
      sender_role: m.sender,
      message: m.message,
      created_at: m.createdAt.toISOString(),
    }));
  }

  /**
   * Creates a new chat message sent by the student.
   * The sender_role is strictly hardcoded to "STUDENT" by the server.
   */
  async createStudentMessage(
    token: string,
    messageText: string
  ): Promise<CreatedMessageResult> {
    const report = await prisma.report.findUnique({
      where: { secretToken: token },
      select: { id: true },
    });

    if (!report) {
      throw new ChatServiceError(
        "NOT_FOUND",
        "Laporan tidak ditemukan atau format kode tiket tidak valid.",
        404
      );
    }

    const created = await prisma.reportMessage.create({
      data: {
        reportId: report.id,
        sender: "STUDENT",
        message: messageText,
      },
      select: {
        id: true,
        reportId: true,
        sender: true,
        message: true,
        createdAt: true,
      },
    });

    return {
      id: created.id,
      report_id: created.reportId,
      sender_role: created.sender,
      message: created.message,
      created_at: created.createdAt.toISOString(),
    };
  }

  /**
   * Creates a new chat message sent by the counselor.
   * The sender_role is strictly hardcoded to "COUNSELOR" by the server.
   */
  async createCounselorMessage(
    reportId: string,
    messageText: string
  ): Promise<CreatedMessageResult> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (!report) {
      throw new ChatServiceError(
        "NOT_FOUND",
        "Laporan yang dituju tidak ditemukan.",
        404
      );
    }

    const created = await prisma.reportMessage.create({
      data: {
        reportId: report.id,
        sender: "COUNSELOR",
        message: messageText,
      },
      select: {
        id: true,
        reportId: true,
        sender: true,
        message: true,
        createdAt: true,
      },
    });

    return {
      id: created.id,
      report_id: created.reportId,
      sender_role: created.sender,
      message: created.message,
      created_at: created.createdAt.toISOString(),
    };
  }
}

export const chatService = new ChatService();
