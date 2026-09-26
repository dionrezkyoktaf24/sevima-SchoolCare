import { z } from "zod";

/**
 * Common chat message text schema:
 * - String
 * - Trims whitespace
 * - Minimum 1 character (rejects empty messages)
 * - Maximum 2000 characters
 */
export const chatMessageTextSchema = z
  .string({
    error: "Pesan wajib diisi berupa teks.",
  })
  .trim()
  .min(1, "Pesan tidak boleh kosong.")
  .max(2000, "Pesan maksimal 2000 karakter.");

/**
 * Validation schema for student sending a chat message:
 * POST /api/chat
 * Student identifies themselves solely through their secret ticket token.
 */
export const studentMessageSchema = z.object({
  token: z
    .string({
      error: "Kode tiket token wajib disertakan.",
    })
    .trim()
    .regex(/^CARE-[0-9A-F]{4}-[0-9A-F]{4}$/i, "Format kode tiket tidak valid (contoh: CARE-8F2A-99BC).")
    .transform((val) => val.toUpperCase()),
  message: chatMessageTextSchema,
});

export type StudentMessageInput = z.infer<typeof studentMessageSchema>;

/**
 * Validation schema for counselor sending a chat message:
 * POST /api/chat/counselor
 * Counselor specifies the target report by report_id UUID.
 */
export const counselorMessageSchema = z.object({
  report_id: z
    .string({
      error: "ID laporan (report_id) wajib diisi.",
    })
    .trim()
    .uuid("Format report_id harus berupa UUID yang valid."),
  message: chatMessageTextSchema,
});

export type CounselorMessageInput = z.infer<typeof counselorMessageSchema>;

/**
 * Query schema for student retrieving report messages:
 * GET /api/chat?token=CARE-XXXX-XXXX
 */
export const getStudentMessagesQuerySchema = z.object({
  token: z
    .string({
      error: "Parameter 'token' wajib disertakan.",
    })
    .trim()
    .regex(/^CARE-[0-9A-F]{4}-[0-9A-F]{4}$/i, "Format kode tiket tidak valid (contoh: CARE-8F2A-99BC).")
    .transform((val) => val.toUpperCase()),
});

export type GetStudentMessagesQueryInput = z.infer<typeof getStudentMessagesQuerySchema>;

/**
 * Query schema for counselor retrieving report messages:
 * GET /api/chat/counselor?report_id=...
 */
export const getCounselorMessagesQuerySchema = z.object({
  report_id: z
    .string({
      error: "Parameter 'report_id' wajib disertakan.",
    })
    .trim()
    .uuid("Format report_id harus berupa UUID yang valid."),
});

export type GetCounselorMessagesQueryInput = z.infer<typeof getCounselorMessagesQuerySchema>;
