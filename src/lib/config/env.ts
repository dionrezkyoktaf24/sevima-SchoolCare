import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters long").optional().default("default-secret-key-min-16-chars-long"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),
});

export const env = envSchema.parse(process.env);
