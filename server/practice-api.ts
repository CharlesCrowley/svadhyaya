import { Router, type Request } from "express";
import { z } from "zod";
import {
  acceptConsent,
  deleteUser,
  findUserByTelegramId,
  readPracticeHistory,
  setMeditation,
  setSvadhyaya
} from "./database.js";
import { env } from "./env.js";
import { TelegramAuthError, verifyTelegramInitData } from "./telegram-auth.js";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  });
const consentSchema = z.object({
  consentVersion: z.literal("pilot-es-v1"),
  timezone: z.literal("Europe/Madrid"),
  locale: z.literal("es")
});
const meditationSchema = z.discriminatedUnion("complete", [
  z.object({ complete: z.literal(true), minutes: z.number().int().min(1).max(180) }),
  z.object({ complete: z.literal(false) })
]);
const svadhyayaSchema = z.object({ complete: z.boolean() });

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function authenticate(request: Request) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ALLOWED_USER_ID) {
    throw new ApiError(503, "Telegram authentication is not configured");
  }
  const initData = request.get("x-telegram-init-data");
  if (!initData) throw new ApiError(401, "Telegram authentication is required");
  try {
    const user = verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN, {
      maxAgeSeconds: env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
    });
    if (String(user.id) !== env.TELEGRAM_ALLOWED_USER_ID) {
      throw new ApiError(403, "This private pilot is not available for this Telegram account");
    }
    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof TelegramAuthError) throw new ApiError(401, "Telegram authentication is invalid");
    throw error;
  }
}

async function authenticatedPersistedUser(request: Request) {
  const telegramUser = authenticate(request);
  const user = await findUserByTelegramId(String(telegramUser.id));
  if (!user) throw new ApiError(428, "Consent is required before saving practice data");
  return user;
}

function assertPermittedDate(date: string, timezone: string) {
  const parsed = dateSchema.safeParse(date);
  if (!parsed.success) throw new ApiError(400, "Practice date is invalid");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const toUtcDay = (value: string) => Date.parse(`${value}T00:00:00Z`);
  const daysAgo = (toUtcDay(today) - toUtcDay(date)) / 86_400_000;
  if (!Number.isInteger(daysAgo) || daysAgo < 0 || daysAgo > 7) {
    throw new ApiError(400, "Practice date must be today or within the previous seven days");
  }
}

export const practiceApi = Router();

practiceApi.get("/session", async (request, response) => {
  const telegramUser = authenticate(request);
  const user = await findUserByTelegramId(String(telegramUser.id));
  response.json({
    authenticated: true,
    consented: Boolean(user),
    consentVersion: user?.consentVersion,
    locale: user?.locale ?? "es"
  });
});

practiceApi.post("/consent", async (request, response) => {
  const telegramUser = authenticate(request);
  const input = consentSchema.parse(request.body);
  const user = await acceptConsent({ telegramUserId: String(telegramUser.id), ...input });
  response.status(201).json({ consented: true, consentedAt: user.consentedAt });
});

practiceApi.get("/history", async (request, response) => {
  const user = await authenticatedPersistedUser(request);
  const from = dateSchema.parse(request.query.from);
  const to = dateSchema.parse(request.query.to);
  response.json({ days: await readPracticeHistory(user.id, from, to) });
});

practiceApi.put("/practice/:date/svadhyaya", async (request, response) => {
  const user = await authenticatedPersistedUser(request);
  assertPermittedDate(request.params.date, user.timezone);
  const input = svadhyayaSchema.parse(request.body);
  await setSvadhyaya(user.id, request.params.date, input.complete);
  response.sendStatus(204);
});

practiceApi.put("/practice/:date/meditation", async (request, response) => {
  const user = await authenticatedPersistedUser(request);
  assertPermittedDate(request.params.date, user.timezone);
  const input = meditationSchema.parse(request.body);
  await setMeditation(user.id, request.params.date, input.complete, input.complete ? input.minutes : undefined);
  response.sendStatus(204);
});

practiceApi.get("/me/export", async (request, response) => {
  const user = await authenticatedPersistedUser(request);
  response.json({
    exportedAt: new Date().toISOString(),
    user,
    practiceDays: await readPracticeHistory(user.id, "1900-01-01", "9999-12-31")
  });
});

practiceApi.delete("/me", async (request, response) => {
  const user = await authenticatedPersistedUser(request);
  await deleteUser(user.id);
  response.sendStatus(204);
});

practiceApi.use((error: unknown, _request: Request, response: import("express").Response, _next: import("express").NextFunction) => {
  if (error instanceof ApiError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: "Request data is invalid" });
    return;
  }
  response.status(500).json({ error: "Unexpected server error" });
});
