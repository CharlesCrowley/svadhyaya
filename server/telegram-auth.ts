import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const telegramUserSchema = z.object({
  id: z.number().int().positive().safe(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional()
});

export type TelegramUser = z.infer<typeof telegramUserSchema>;

export class TelegramAuthError extends Error {}

export function verifyTelegramInitData(
  rawInitData: string,
  botToken: string,
  options: { now?: Date; maxAgeSeconds?: number } = {}
): TelegramUser {
  if (!rawInitData || rawInitData.length > 8192) {
    throw new TelegramAuthError("Telegram authentication data is missing or too large");
  }

  const params = new URLSearchParams(rawInitData);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) {
    throw new TelegramAuthError("Telegram authentication contains duplicate fields");
  }

  const receivedHash = params.get("hash");
  if (!receivedHash || !/^[a-f\d]{64}$/i.test(receivedHash)) {
    throw new TelegramAuthError("Telegram authentication hash is invalid");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secret).update(dataCheckString).digest();
  const receivedHashBytes = Buffer.from(receivedHash, "hex");
  if (
    receivedHashBytes.length !== expectedHash.length ||
    !timingSafeEqual(receivedHashBytes, expectedHash)
  ) {
    throw new TelegramAuthError("Telegram authentication signature is invalid");
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isInteger(authDate) || authDate <= 0) {
    throw new TelegramAuthError("Telegram authentication date is invalid");
  }
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? 3600;
  if (authDate > nowSeconds + 30 || nowSeconds - authDate > maxAgeSeconds) {
    throw new TelegramAuthError("Telegram authentication has expired");
  }

  const rawUser = params.get("user");
  if (!rawUser) throw new TelegramAuthError("Telegram user data is missing");
  try {
    return telegramUserSchema.parse(JSON.parse(rawUser));
  } catch {
    throw new TelegramAuthError("Telegram user data is invalid");
  }
}
