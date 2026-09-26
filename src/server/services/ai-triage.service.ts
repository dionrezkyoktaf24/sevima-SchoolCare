import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import {
  aiTriageOutputSchema,
  type AiTriageOutput,
} from "@/lib/validation/ai-triage";
import { buildTriagePrompt, type TriagePromptPackage } from "@/server/ai/prompt";
import type { SeverityLevel } from "@prisma/client";

export class AiTriageError extends Error {
  constructor(
    public code:
      | "REPORT_NOT_FOUND"
      | "AI_CONFIG_ERROR"
      | "AI_PROVIDER_ERROR"
      | "AI_VALIDATION_ERROR"
      | "AI_CONCURRENT_REQUEST",
    message: string
  ) {
    super(message);
    this.name = "AiTriageError";
  }
}

export interface AiTriageResult {
  report_id: string;
  status: string;
  triage: AiTriageOutput;
  updated_at: string;
}

// In-memory set to prevent concurrent triage executions for the same report
const activeTriageReports = new Set<string>();

// Mockable generator signature for automated tests without live quota usage
export type GeminiRunner = (promptPkg: TriagePromptPackage) => Promise<string>;

export class AiTriageService {
  private customRunner: GeminiRunner | null = null;

  /**
   * For test environments: inject a mock runner to test schema validation and edge cases
   */
  setRunnerForTesting(runner: GeminiRunner | null) {
    this.customRunner = runner;
  }

  /**
   * Runs the complete AI triage pipeline for an existing report.
   * Persists results to PostgreSQL only if both Gemini and Zod validation succeed.
   */
  async runTriage(reportId: string): Promise<AiTriageResult> {
    // 1. Prevent concurrent runs on the same report
    if (activeTriageReports.has(reportId)) {
      throw new AiTriageError(
        "AI_CONCURRENT_REQUEST",
        "Triase AI sedang berjalan untuk laporan ini. Harap menunggu hingga selesai."
      );
    }

    activeTriageReports.add(reportId);

    try {
      // 2. Retrieve existing report from database
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          category: true,
          incidentLocation: true,
          incidentTime: true,
          description: true,
          status: true,
        },
      });

      if (!report) {
        throw new AiTriageError(
          "REPORT_NOT_FOUND",
          "Laporan yang akan dianalisis tidak ditemukan."
        );
      }

      // 3. Build safe prompt (excluding tokens, UUIDs, or credentials)
      const promptPkg = buildTriagePrompt({
        category: report.category,
        incidentLocation: report.incidentLocation,
        incidentTime: report.incidentTime,
        description: report.description,
        status: report.status,
      });

      // 4. Generate AI triage response
      let rawJsonText: string;

      if (this.customRunner) {
        rawJsonText = await this.customRunner(promptPkg);
      } else {
        rawJsonText = await this.callGeminiApi(promptPkg);
      }

      // 5. Clean and parse JSON response
      const cleanedJson = this.sanitizeJsonString(rawJsonText);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanedJson);
      } catch {
        throw new AiTriageError(
          "AI_VALIDATION_ERROR",
          "Layanan AI menghasilkan format data yang tidak valid."
        );
      }

      // 6. Strict Zod validation
      const validation = aiTriageOutputSchema.safeParse(parsedJson);
      if (!validation.success) {
        throw new AiTriageError(
          "AI_VALIDATION_ERROR",
          "Hasil rekomendasi AI tidak memenuhi standar validasi sistem."
        );
      }

      const triageData = validation.data;

      // 7. Persist validated triage recommendations to database
      // The original report remains intact even if any prior step failed
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          aiSeverity: triageData.severity as SeverityLevel,
          aiConfidence: triageData.confidence,
          aiRiskSummary: triageData.risk_summary,
          aiActionPlan: triageData.action_plans,
          aiDraftResponse: triageData.draft_response,
        },
        select: {
          id: true,
          status: true,
          aiSeverity: true,
          aiConfidence: true,
          aiRiskSummary: true,
          aiActionPlan: true,
          aiDraftResponse: true,
          updatedAt: true,
        },
      });

      return {
        report_id: updated.id,
        status: updated.status,
        triage: {
          severity: updated.aiSeverity,
          confidence: Number(updated.aiConfidence ?? 0),
          risk_summary: updated.aiRiskSummary ?? "",
          action_plans: (updated.aiActionPlan as unknown as AiTriageOutput["action_plans"]) ?? [],
          draft_response: updated.aiDraftResponse ?? "",
        },
        updated_at: updated.updatedAt.toISOString(),
      };
    } finally {
      activeTriageReports.delete(reportId);
    }
  }

  /**
   * Calls the live Google Gemini API using @google/genai SDK with safe configuration and timeout.
   */
  private async callGeminiApi(promptPkg: TriagePromptPackage): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim();

    if (!apiKey) {
      throw new AiTriageError(
        "AI_CONFIG_ERROR",
        "Layanan AI belum dikonfigurasi (GEMINI_API_KEY tidak ditemukan)."
      );
    }

    if (!model) {
      throw new AiTriageError(
        "AI_CONFIG_ERROR",
        "Model Gemini AI tidak valid atau tidak ditentukan (GEMINI_MODEL tidak ditemukan)."
      );
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Timeout safety: 20 seconds maximum
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 20000)
      );

      const apiCall = ai.models.generateContent({
        model,
        contents: promptPkg.userPrompt,
        config: {
          systemInstruction: promptPkg.systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2, // Low temperature for consistent, factual triage
        },
      });

      const response = await Promise.race([apiCall, timeoutPromise]);
      const text = response.text;

      if (!text) {
        throw new Error("EMPTY_GEMINI_RESPONSE");
      }

      return text;
    } catch (err: unknown) {
      // Check for timeout
      if (err instanceof Error && err.message === "GEMINI_TIMEOUT") {
        throw new AiTriageError(
          "AI_PROVIDER_ERROR",
          "Waktu permintaan analisis AI habis. Silakan coba kembali."
        );
      }

      // Do NOT leak raw Gemini error headers or API keys
      throw new AiTriageError(
        "AI_PROVIDER_ERROR",
        "Terjadi kendala saat menghubungi layanan AI. Silakan coba kembali nanti."
      );
    }
  }

  /**
   * Removes markdown code block delimiters if present in the raw LLM response.
   */
  private sanitizeJsonString(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith("```json")) {
      return trimmed.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    }
    if (trimmed.startsWith("```")) {
      return trimmed.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return trimmed;
  }
}

export const aiTriageService = new AiTriageService();
