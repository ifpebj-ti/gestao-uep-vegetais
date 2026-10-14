ALTER TABLE modelos_cultivo
    ADD COLUMN IF NOT EXISTS peso_medio_kg_por_planta NUMERIC(12,4);

UPDATE modelos_cultivo
SET peso_medio_kg_por_planta = CASE id
    WHEN '00000000-0000-0000-0000-000000000501' THEN 1.40
    WHEN '00000000-0000-0000-0000-000000000502' THEN 2.00
    WHEN '00000000-0000-0000-0000-000000000503' THEN 0.25
    WHEN '00000000-0000-0000-0000-000000000504' THEN 0.60
    WHEN '00000000-0000-0000-0000-000000000505' THEN 0.10
    WHEN '00000000-0000-0000-0000-000000000506' THEN 0.10
    WHEN '00000000-0000-0000-0000-000000000507' THEN 0.40
    WHEN '00000000-0000-0000-0000-000000000508' THEN 0.10
    ELSE COALESCE(produtividade_kg_por_planta, peso_medio_kg_por_unidade, 0.10)
END
WHERE peso_medio_kg_por_planta IS NULL;

ALTER TABLE modelos_cultivo
    ALTER COLUMN peso_medio_kg_por_planta SET NOT NULL,
    ADD CONSTRAINT ck_modelo_peso_medio_kg_por_planta
        CHECK (peso_medio_kg_por_planta > 0);

ALTER TABLE fichas_campo
    ADD COLUMN IF NOT EXISTS previsao_peso_medio_kg_por_planta NUMERIC(12,4);
