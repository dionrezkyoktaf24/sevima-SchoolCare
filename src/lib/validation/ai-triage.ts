import { z } from "zod";

/**
 * Strict schema for individual recommended action items.
 */
export const aiActionPlanItemSchema = z.object({
  priority: z
    .number()
    .int("Prioritas harus berupa bilangan bulat.")
    .min(1, "Prioritas minimal 1.")
    .max(10, "Prioritas maksimal 10."),
  action: z
    .string()
    .trim()
    .min(5, "Tindakan minimal 5 karakter.")
    .max(300, "Tindakan maksimal 300 karakter."),
  reason: z
    .string()
    .trim()
    .min(5, "Alasan tindakan minimal 5 karakter.")
    .max(500, "Alasan tindakan maksimal 500 karakter."),
});

export type AiActionPlanItem = z.infer<typeof aiActionPlanItemSchema>;

/**
 * Strict schema for the complete Gemini AI Triage output.
 * Guarantees that arbitrary or hallucinated fields from the model are rejected.
 */
export const aiTriageOutputSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    error: "Tingkat keparahan (severity) harus bernilai: LOW, MEDIUM, HIGH, atau CRITICAL.",
  }),
  confidence: z
    .number()
    .min(0, "Confidence minimal 0.0.")
    .max(1, "Confidence maksimal 1.0."),
  risk_summary: z
    .string()
    .trim()
    .min(10, "Ringkasan risiko minimal 10 karakter.")
    .max(1000, "Ringkasan risiko maksimal 1000 karakter."),
  action_plans: z
    .array(aiActionPlanItemSchema)
    .min(1, "Rencana tindakan minimal memiliki 1 butir rekomendasi.")
    .max(5, "Rencana tindakan maksimal memiliki 5 butir rekomendasi."),
  draft_response: z
    .string()
    .trim()
    .min(10, "Draf pesan respon minimal 10 karakter.")
    .max(1000, "Draf pesan respon maksimal 1000 karakter."),
});

export type AiTriageOutput = z.infer<typeof aiTriageOutputSchema>;
