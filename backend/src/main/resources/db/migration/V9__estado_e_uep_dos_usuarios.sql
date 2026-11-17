ALTER TABLE usuarios
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN uep VARCHAR(12) CHECK (uep IN ('olericultura', 'fruticultura'));

UPDATE usuarios
SET uep = 'olericultura'
WHERE role = 'PROFESSOR';
