import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  TELEGRAM_BOT_TOKEN: z.string().min(20).optional(),
  TELEGRAM_ALLOWED_USER_ID: z.string().regex(/^\d+$/).optional(),
  AWS_ENDPOINT_URL: z.string().url().optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_BUCKET_NAME: z.string().min(1).optional(),
  AWS_DEFAULT_REGION: z.string().min(1).optional()
});

export const env = envSchema.parse(process.env);
