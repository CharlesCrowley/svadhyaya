import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TelegramAuthError, verifyTelegramInitData } from "./telegram-auth";

const token = "123456789:test-token-long-enough-for-validation";
const now = new Date("2026-08-13T12:00:00Z");

function signInitData(overrides: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(now.getTime() / 1000)),
    query_id: "test-query",
    user: JSON.stringify({ id: 711613757, first_name: "Charlie", language_code: "es" }),
    ...overrides
  });
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  params.set("hash", createHmac("sha256", secret).update(dataCheckString).digest("hex"));
  return params.toString();
}

describe("verifyTelegramInitData", () => {
  it("returns the signed Telegram user", () => {
    expect(verifyTelegramInitData(signInitData(), token, { now })).toMatchObject({
      id: 711613757,
      first_name: "Charlie",
      language_code: "es"
    });
  });

  it("rejects tampered data", () => {
    const tampered = signInitData().replace("Charlie", "Mallory");
    expect(() => verifyTelegramInitData(tampered, token, { now })).toThrow(TelegramAuthError);
  });

  it("rejects expired data", () => {
    const oldDate = String(Math.floor(now.getTime() / 1000) - 3601);
    expect(() => verifyTelegramInitData(signInitData({ auth_date: oldDate }), token, { now })).toThrow(
      "expired"
    );
  });

  it("rejects a future authentication date", () => {
    const futureDate = String(Math.floor(now.getTime() / 1000) + 31);
    expect(() => verifyTelegramInitData(signInitData({ auth_date: futureDate }), token, { now })).toThrow(
      "expired"
    );
  });

  it("rejects duplicate fields", () => {
    expect(() => verifyTelegramInitData(`${signInitData()}&auth_date=1`, token, { now })).toThrow(
      "duplicate"
    );
  });
});
