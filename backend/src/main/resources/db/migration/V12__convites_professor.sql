ALTER TABLE usuarios
    ADD COLUMN confirmacao_novo_email_pendente BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE convites_professor (
    id UUID NOT NULL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    usado_em TIMESTAMP WITH TIME ZONE,
    invalidado_em TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_convite_professor_hash UNIQUE (token_hash),
    CONSTRAINT fk_convite_professor_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX idx_convite_professor_usuario ON convites_professor (usuario_id);

CREATE UNIQUE INDEX uk_convite_professor_aberto_usuario
    ON convites_professor (usuario_id)
    WHERE usado_em IS NULL AND invalidado_em IS NULL;
