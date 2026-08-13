import {
  bigint,
  boolean,
  check,
  date,
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const svadhyayaSchema = pgSchema("svadhyaya");

export const users = svadhyayaSchema.table(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    telegramUserId: bigint("telegram_user_id", { mode: "bigint" }).notNull(),
    timezone: text("timezone").notNull().default("Europe/Madrid"),
    locale: text("locale").notNull().default("es"),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
    consentVersion: text("consent_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique("users_telegram_user_id_key").on(table.telegramUserId),
    check("users_telegram_user_id_positive", sql`${table.telegramUserId} > 0`),
    check("users_timezone_not_blank", sql`btrim(${table.timezone}) <> ''`),
    check("users_locale_not_blank", sql`btrim(${table.locale}) <> ''`),
    check("users_consent_version_not_blank", sql`btrim(${table.consentVersion}) <> ''`)
  ]
);

export const practiceDays = svadhyayaSchema.table(
  "practice_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    practiceDate: date("practice_date").notNull(),
    svadhyayaComplete: boolean("svadhyaya_complete").notNull().default(false),
    meditationComplete: boolean("meditation_complete").notNull().default(false),
    meditationMinutes: integer("meditation_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique("practice_days_user_date_unique").on(table.userId, table.practiceDate),
    check(
      "practice_days_meditation_completion_valid",
      sql`(
        (${table.meditationComplete}
          AND ${table.meditationMinutes} IS NOT NULL
          AND ${table.meditationMinutes} >= 1)
        OR
        (NOT ${table.meditationComplete}
          AND ${table.meditationMinutes} IS NULL)
      )`
    )
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PracticeDay = typeof practiceDays.$inferSelect;
export type NewPracticeDay = typeof practiceDays.$inferInsert;
