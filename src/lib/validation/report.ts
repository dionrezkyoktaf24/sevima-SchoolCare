import { z } from "zod";

/**
 * Valid categories based on PRD / DESIGN documentation:
 * - Kekerasan fisik
 * - Pemalakan
 * - Intimidasi / bullying
 * - Kekerasan siber
 * - Pelecehan
 * - Lainnya
 */
export const REPORT_CATEGORIES = [
  "Kekerasan fisik",
  "Pemalakan",
  "Intimidasi / bullying",
  "Kekerasan siber",
  "Pelecehan",
  "Lainnya",
] as const;

/**
 * Server-side validation schema for creating a new report.
 * Strictly adheres to PRD requirements:
 * - school_id: required
 * - category: required
 * - incident_location: required (max 150 chars)
 * - description: required, min 20 characters
 * - incident_time: optional (max 100 chars)
 * - evidence_url: optional URL
 */
export const createReportSchema = z.object({
  school_id: z
    .string({
      error: "ID Sekolah wajib diisi.",
    })
    .trim()
    .min(1, "ID Sekolah tidak boleh kosong.")
    .max(50, "ID Sekolah maksimal 50 karakter."),
  category: z
    .string({
      error: "Kategori laporan wajib dipilih.",
    })
    .trim()
    .min(1, "Kategori laporan tidak boleh kosong.")
    .max(50, "Kategori laporan maksimal 50 karakter."),
  incident_location: z
    .string({
      error: "Lokasi kejadian wajib diisi.",
    })
    .trim()
    .min(1, "Lokasi kejadian tidak boleh kosong.")
    .max(150, "Lokasi kejadian maksimal 150 karakter."),
  incident_time: z
    .string()
    .trim()
    .max(100, "Perkiraan waktu maksimal 100 karakter.")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  description: z
    .string({
      error: "Deskripsi kejadian wajib diisi.",
    })
    .trim()
    .min(20, "Deskripsi kejadian minimal 20 karakter."),
  evidence_url: z
    .string()
    .trim()
    .url("Format URL bukti tidak valid.")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val && val.length > 0 ? val : null)),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Schema for verifying a ticket token when tracking or opening chat.
 */
export const trackReportSchema = z.object({
  token: z
    .string({
      error: "Kode tiket token wajib disertakan.",
    })
    .trim()
    .regex(/^CARE-[0-9A-F]{4}-[0-9A-F]{4}$/i, "Format kode tiket tidak valid (contoh: CARE-8F2A-99BC).")
    .transform((val) => val.toUpperCase()),
});

export type TrackReportInput = z.infer<typeof trackReportSchema>;
