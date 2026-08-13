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
    900000001,
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

  UPDATE svadhyaya.practice_days
  SET meditation_complete = true,
      meditation_minutes = 20,
      updated_at = now()
  WHERE user_id = test_user_id
    AND practice_date = DATE '2026-08-13';

  IF NOT EXISTS (
    SELECT 1
    FROM svadhyaya.practice_days
    WHERE user_id = test_user_id
      AND practice_date = DATE '2026-08-13'
      AND svadhyaya_complete
      AND meditation_complete
      AND meditation_minutes = 20
  ) THEN
    RAISE EXCEPTION 'valid complete practice day was not preserved';
  END IF;

  BEGIN
    INSERT INTO svadhyaya.practice_days (
      user_id,
      practice_date,
      meditation_complete,
      meditation_minutes
    ) VALUES (
      test_user_id,
      DATE '2026-08-14',
      true,
      NULL
    );
    RAISE EXCEPTION 'completed meditation with NULL minutes was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO svadhyaya.practice_days (
      user_id,
      practice_date,
      meditation_complete,
      meditation_minutes
    ) VALUES (
      test_user_id,
      DATE '2026-08-14',
      true,
      0
    );
    RAISE EXCEPTION 'completed meditation with zero minutes was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO svadhyaya.practice_days (
      user_id,
      practice_date,
      meditation_complete,
      meditation_minutes
    ) VALUES (
      test_user_id,
      DATE '2026-08-14',
      false,
      20
    );
    RAISE EXCEPTION 'incomplete meditation with minutes was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO svadhyaya.practice_days (
      user_id,
      practice_date
    ) VALUES (
      test_user_id,
      DATE '2026-08-13'
    );
    RAISE EXCEPTION 'duplicate user practice date was accepted';
  EXCEPTION
    WHEN unique_violation THEN NULL;
  END;

  DELETE FROM svadhyaya.users WHERE id = test_user_id;

  IF EXISTS (
    SELECT 1 FROM svadhyaya.practice_days WHERE user_id = test_user_id
  ) THEN
    RAISE EXCEPTION 'user deletion did not cascade to practice days';
  END IF;
END
$$;

ROLLBACK;
