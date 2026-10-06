CREATE TABLE IF NOT EXISTS usuarios (
    id UUID NOT NULL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    email_verificado BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE IF EXISTS usuarios
    ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN;

UPDATE usuarios
SET email_verificado = TRUE
WHERE email_verificado IS NULL;

ALTER TABLE IF EXISTS usuarios
    ALTER COLUMN email_verificado SET DEFAULT TRUE;

ALTER TABLE IF EXISTS usuarios
    ALTER COLUMN email_verificado SET NOT NULL;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID NOT NULL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    usado_em TIMESTAMP WITH TIME ZONE,
    invalidado_em TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_email_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_email_token_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX IF NOT EXISTS idx_email_token_usuario
    ON email_verification_tokens (usuario_id);
