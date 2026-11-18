-- As contas existentes recebem o instante da migração como aproximação.
ALTER TABLE usuarios
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN uep VARCHAR(12) CHECK (uep IN ('olericultura', 'fruticultura')),
    ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE usuarios
SET uep = 'olericultura'
WHERE role = 'PROFESSOR';
