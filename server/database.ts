import postgres from "postgres";
import { env } from "./env.js";

export interface PersistedUser {
  id: string;
  telegramUserId: string;
  timezone: string;
  locale: string;
  consentedAt: string;
  consentVersion: string;
}

export interface PersistedPracticeDay {
  date: string;
  svadhyaya: boolean;
  meditation: boolean;
  meditationMinutes?: number;
}

let client: ReturnType<typeof postgres> | undefined;

function sql() {
  if (!env.DATABASE_URL) throw new Error("Database is not configured");
  client ??= postgres(env.DATABASE_URL, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false
  });
  return client;
}

export async function findUserByTelegramId(telegramUserId: string): Promise<PersistedUser | null> {
  const rows = await sql()<PersistedUser[]>`
    SELECT
      id,
      telegram_user_id::text AS "telegramUserId",
      timezone,
      locale,
      consented_at::text AS "consentedAt",
      consent_version AS "consentVersion"
    FROM svadhyaya.users
    WHERE telegram_user_id = ${telegramUserId}
  `;
  return rows[0] ?? null;
}

export async function acceptConsent(input: {
  telegramUserId: string;
  timezone: string;
  locale: string;
  consentVersion: string;
}): Promise<PersistedUser> {
  const rows = await sql()<PersistedUser[]>`
    INSERT INTO svadhyaya.users (
      telegram_user_id,
      timezone,
      locale,
      consented_at,
      consent_version
    ) VALUES (
      ${input.telegramUserId},
      ${input.timezone},
      ${input.locale},
      now(),
      ${input.consentVersion}
    )
    ON CONFLICT (telegram_user_id) DO UPDATE SET
      timezone = EXCLUDED.timezone,
      locale = EXCLUDED.locale,
      consented_at = now(),
      consent_version = EXCLUDED.consent_version,
      updated_at = now()
    RETURNING
      id,
      telegram_user_id::text AS "telegramUserId",
      timezone,
      locale,
      consented_at::text AS "consentedAt",
      consent_version AS "consentVersion"
  `;
  return rows[0];
}

export async function readPracticeHistory(userId: string, from: string, to: string) {
  return sql()<PersistedPracticeDay[]>`
    SELECT
      practice_date::text AS date,
      svadhyaya_complete AS svadhyaya,
      meditation_complete AS meditation,
      meditation_minutes AS "meditationMinutes"
    FROM svadhyaya.practice_days
    WHERE user_id = ${userId}
      AND practice_date BETWEEN ${from}::date AND ${to}::date
    ORDER BY practice_date
  `;
}

export async function setSvadhyaya(userId: string, date: string, complete: boolean): Promise<void> {
  await sql()`
    INSERT INTO svadhyaya.practice_days (user_id, practice_date, svadhyaya_complete)
    VALUES (${userId}, ${date}::date, ${complete})
    ON CONFLICT (user_id, practice_date) DO UPDATE SET
      svadhyaya_complete = EXCLUDED.svadhyaya_complete,
      updated_at = now()
  `;
}

export async function setMeditation(
  userId: string,
  date: string,
  complete: boolean,
  minutes?: number
): Promise<void> {
  if (complete && (!Number.isInteger(minutes) || (minutes ?? 0) < 1)) {
    throw new Error("Completed meditation requires at least one minute");
  }
  const meditationMinutes = complete ? (minutes as number) : null;
  await sql()`
    INSERT INTO svadhyaya.practice_days (
      user_id,
      practice_date,
      meditation_complete,
      meditation_minutes
    ) VALUES (
      ${userId},
      ${date}::date,
      ${complete},
      ${meditationMinutes}
    )
    ON CONFLICT (user_id, practice_date) DO UPDATE SET
      meditation_complete = EXCLUDED.meditation_complete,
      meditation_minutes = EXCLUDED.meditation_minutes,
      updated_at = now()
  `;
}

export async function deleteUser(userId: string): Promise<void> {
  await sql()`DELETE FROM svadhyaya.users WHERE id = ${userId}`;
}
