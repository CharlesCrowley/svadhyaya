\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  test_user_id UUID;
BEGIN
  INSERT INTO svadhyaya.users (
    telegram_user_id,
    consented_at,
    consent_version
  ) VALUES (
    900000002,
    now(),
    'test-v1'
  ) RETURNING id INTO test_user_id;

  INSERT INTO svadhyaya.practice_days (
    user_id,
    practice_date,
    svadhyaya_complete
  ) VALUES (
    test_user_id,
    DATE '2026-08-13',
    true
  );

  IF NOT EXISTS (
    SELECT 1
    FROM svadhyaya.practice_days
    WHERE user_id = test_user_id
      AND svadhyaya_complete
  ) THEN
    RAISE EXCEPTION 'application role could not read its inserted practice day';
  END IF;

  UPDATE svadhyaya.practice_days
  SET meditation_complete = true,
      meditation_minutes = 20
  WHERE user_id = test_user_id;

  DELETE FROM svadhyaya.users WHERE id = test_user_id;

  BEGIN
    EXECUTE 'CREATE TABLE svadhyaya.forbidden_ddl (id integer)';
    RAISE EXCEPTION 'application role unexpectedly created a table';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END
$$;

ROLLBACK;
