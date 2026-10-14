CREATE TABLE IF NOT EXISTS modelos_cultivo (
    id UUID NOT NULL PRIMARY KEY,
    cultura VARCHAR(120) NOT NULL,
    variedade VARCHAR(120),
    espacamento_linhas_m NUMERIC(8,4) NOT NULL CHECK (espacamento_linhas_m > 0),
    espacamento_plantas_m NUMERIC(8,4) NOT NULL CHECK (espacamento_plantas_m > 0),
    produtividade_kg_por_planta NUMERIC(12,4),
    peso_medio_kg_por_unidade NUMERIC(12,4),
    unidade_producao VARCHAR(20) NOT NULL CHECK (unidade_producao IN ('KG', 'UNIDADE', 'MACO')),
    fator_aproveitamento NUMERIC(5,4) NOT NULL DEFAULT 1.0000
        CHECK (fator_aproveitamento > 0 AND fator_aproveitamento <= 1),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_por UUID,
    CONSTRAINT fk_modelo_cultivo_atualizado_por
        FOREIGN KEY (atualizado_por) REFERENCES usuarios (id)
);

CREATE INDEX IF NOT EXISTS idx_modelos_cultivo_cultura
    ON modelos_cultivo (cultura);

ALTER TABLE fichas_campo
    ADD COLUMN IF NOT EXISTS modelo_cultivo_id UUID,
    ADD COLUMN IF NOT EXISTS area_canteiro_m2 NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS plantas_por_canteiro_valor NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS plantas_por_ha_valor NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS previsao_plantas NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS previsao_colheita_kg NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS previsao_fator_aproveitamento NUMERIC(5,4),
    ADD COLUMN IF NOT EXISTS previsao_calculada_em TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS previsao_aviso TEXT;

ALTER TABLE fichas_campo
    DROP CONSTRAINT IF EXISTS fk_ficha_modelo_cultivo;

ALTER TABLE fichas_campo
    ADD CONSTRAINT fk_ficha_modelo_cultivo
        FOREIGN KEY (modelo_cultivo_id) REFERENCES modelos_cultivo (id);

INSERT INTO modelos_cultivo (
    id, cultura, variedade, espacamento_linhas_m, espacamento_plantas_m,
    produtividade_kg_por_planta, peso_medio_kg_por_unidade, unidade_producao,
    fator_aproveitamento
) VALUES
    ('00000000-0000-0000-0000-000000000501', 'Abobrinha', 'Caserta', 1.00, 0.70, 1.40, NULL, 'KG', 1.00),
    ('00000000-0000-0000-0000-000000000502', 'Abobrinha', 'Menina', 2.00, 2.00, 2.00, NULL, 'KG', 1.00),
    ('00000000-0000-0000-0000-000000000503', 'Alface', 'Lisa ou crespa', 0.30, 0.30, NULL, NULL, 'UNIDADE', 0.80),
    ('00000000-0000-0000-0000-000000000504', 'Batata', NULL, 0.80, 0.30, 0.60, NULL, 'KG', 0.90),
    ('00000000-0000-0000-0000-000000000505', 'Cenoura', 'Brasília', 0.20, 0.10, 0.10, NULL, 'KG', 0.70),
    ('00000000-0000-0000-0000-000000000506', 'Beterraba', NULL, 0.25, 0.12, 0.10, NULL, 'KG', 1.00),
    ('00000000-0000-0000-0000-000000000507', 'Brócolo', 'Japonês', 0.80, 0.50, NULL, NULL, 'UNIDADE', 1.00),
    ('00000000-0000-0000-0000-000000000508', 'Cebolinha', NULL, 0.25, 0.20, NULL, NULL, 'MACO', 1.00)
ON CONFLICT (id) DO NOTHING;
