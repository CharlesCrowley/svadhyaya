BEGIN;

CREATE SCHEMA svadhyaya;

CREATE TABLE svadhyaya.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'Europe/Madrid',
  locale TEXT NOT NULL DEFAULT 'es',
  consented_at TIMESTAMPTZ NOT NULL,
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_telegram_user_id_positive
    CHECK (telegram_user_id > 0),
  CONSTRAINT users_timezone_not_blank
    CHECK (btrim(timezone) <> ''),
  CONSTRAINT users_locale_not_blank
    CHECK (btrim(locale) <> ''),
  CONSTRAINT users_consent_version_not_blank
    CHECK (btrim(consent_version) <> '')
);

CREATE TABLE svadhyaya.practice_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES svadhyaya.users(id)
    ON DELETE CASCADE,
  practice_date DATE NOT NULL,
  svadhyaya_complete BOOLEAN NOT NULL DEFAULT false,
  meditation_complete BOOLEAN NOT NULL DEFAULT false,
  meditation_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT practice_days_user_date_unique
    UNIQUE (user_id, practice_date),
  CONSTRAINT practice_days_meditation_completion_valid
    CHECK (
      (
        meditation_complete
        AND meditation_minutes IS NOT NULL
        AND meditation_minutes >= 1
      )
      OR
      (
        NOT meditation_complete
        AND meditation_minutes IS NULL
      )
    )
);

COMMIT;
