import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),
  TELEGRAM_ALLOWED_USER_ID: z.string().regex(/^\d+$/).optional()
});

export const env = envSchema.parse(process.env);
