BEGIN;

GRANT CONNECT ON DATABASE svadhyaya TO svadhyaya_app;
GRANT USAGE ON SCHEMA svadhyaya TO svadhyaya_app;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON svadhyaya.users, svadhyaya.practice_days
  TO svadhyaya_app;

COMMIT;
