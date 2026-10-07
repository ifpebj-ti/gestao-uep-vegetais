ALTER TABLE IF EXISTS usuarios
    ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuario_google_subject
    ON usuarios (google_subject)
    WHERE google_subject IS NOT NULL;
