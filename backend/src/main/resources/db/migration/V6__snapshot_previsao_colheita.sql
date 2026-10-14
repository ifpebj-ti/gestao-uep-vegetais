ALTER TABLE fichas_campo
    ADD COLUMN IF NOT EXISTS previsao_modelo_nome VARCHAR(250),
    ADD COLUMN IF NOT EXISTS previsao_espacamento_linhas_m NUMERIC(8,4),
    ADD COLUMN IF NOT EXISTS previsao_espacamento_plantas_m NUMERIC(8,4),
    ADD COLUMN IF NOT EXISTS previsao_unidade_producao VARCHAR(20),
    ADD COLUMN IF NOT EXISTS previsao_produtividade_kg_por_planta NUMERIC(12,4),
    ADD COLUMN IF NOT EXISTS previsao_peso_medio_kg_por_unidade NUMERIC(12,4);
