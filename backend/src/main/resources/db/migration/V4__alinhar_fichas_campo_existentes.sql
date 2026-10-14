-- Compatibiliza volumes criados por versões anteriores da aplicação.
-- A migration é idempotente para também funcionar em bancos novos.

ALTER TABLE IF EXISTS usuarios
    ADD COLUMN IF NOT EXISTS google_subject VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuario_google_subject
    ON usuarios (google_subject)
    WHERE google_subject IS NOT NULL;

ALTER TABLE IF EXISTS canteiros
    ADD COLUMN IF NOT EXISTS nome VARCHAR(255);

UPDATE canteiros
SET nome = COALESCE(NULLIF(nome, ''), codigo)
WHERE nome IS NULL OR nome = '';

ALTER TABLE IF EXISTS canteiros
    ALTER COLUMN nome SET NOT NULL;

ALTER TABLE IF EXISTS fichas_campo
    ADD COLUMN IF NOT EXISTS canteiro_codigo VARCHAR(32);

UPDATE fichas_campo ficha
SET canteiro_codigo = canteiro.codigo
FROM canteiros canteiro
WHERE ficha.canteiro_id = canteiro.id
  AND (ficha.canteiro_codigo IS NULL OR ficha.canteiro_codigo = '');

ALTER TABLE IF EXISTS fichas_campo
    ADD COLUMN IF NOT EXISTS observacoes TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'fichas_campo'
          AND column_name = 'obs'
    ) THEN
        EXECUTE 'UPDATE fichas_campo SET observacoes = COALESCE(observacoes, obs) WHERE observacoes IS NULL';
    END IF;
END $$;

ALTER TABLE IF EXISTS fichas_campo
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

UPDATE fichas_campo
SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

ALTER TABLE IF EXISTS fichas_campo
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS fichas_campo
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE IF EXISTS canteiro_responsaveis
    ADD COLUMN IF NOT EXISTS ordem SMALLINT;

WITH responsaveis_ordenados AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY canteiro_id ORDER BY id) AS nova_ordem
    FROM canteiro_responsaveis
)
UPDATE canteiro_responsaveis responsavel
SET ordem = responsavel_ordenado.nova_ordem
FROM responsaveis_ordenados responsavel_ordenado
WHERE responsavel.id = responsavel_ordenado.id
  AND responsavel.ordem IS NULL;

ALTER TABLE IF EXISTS canteiro_responsaveis
    ALTER COLUMN ordem SET DEFAULT 1;

ALTER TABLE IF EXISTS canteiro_responsaveis
    ALTER COLUMN ordem SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_canteiro_responsavel_ordem
    ON canteiro_responsaveis (canteiro_id, ordem);
