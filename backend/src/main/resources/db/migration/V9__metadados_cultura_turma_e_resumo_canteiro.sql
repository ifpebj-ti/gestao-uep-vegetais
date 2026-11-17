ALTER TABLE modelos_cultivo
    ADD COLUMN categoria VARCHAR(80),
    ADD COLUMN ciclo_dias INTEGER;

UPDATE modelos_cultivo
SET categoria = CASE
        WHEN lower(cultura) LIKE '%abobrinha%' THEN 'Cucurbitáceas'
        WHEN lower(cultura) LIKE '%alface%' OR lower(cultura) LIKE '%cebolinha%' THEN 'Hortaliças Folhosas'
        WHEN lower(cultura) LIKE '%batata%' OR lower(cultura) LIKE '%cenoura%' OR lower(cultura) LIKE '%beterraba%' THEN 'Raízes e Tubérculos'
        WHEN lower(cultura) LIKE '%brócolo%' OR lower(cultura) LIKE '%brocolo%' OR lower(cultura) LIKE '%brócolis%' THEN 'Brássicas'
        ELSE 'Outras'
    END,
    ciclo_dias = CASE
        WHEN lower(cultura) LIKE '%alface%' THEN 40
        WHEN lower(cultura) LIKE '%cenoura%' THEN 85
        WHEN lower(cultura) LIKE '%beterraba%' THEN 70
        WHEN lower(cultura) LIKE '%abobrinha%' THEN 50
        WHEN lower(cultura) LIKE '%batata%' THEN 90
        WHEN lower(cultura) LIKE '%brócolo%' OR lower(cultura) LIKE '%brocolo%' OR lower(cultura) LIKE '%brócolis%' THEN 85
        WHEN lower(cultura) LIKE '%cebolinha%' THEN 60
        ELSE 60
    END;

ALTER TABLE modelos_cultivo
    ALTER COLUMN categoria SET NOT NULL,
    ALTER COLUMN ciclo_dias SET NOT NULL,
    ADD CONSTRAINT ck_modelo_cultivo_ciclo_dias CHECK (ciclo_dias BETWEEN 1 AND 730);

ALTER TABLE fichas_campo
    ADD COLUMN turma VARCHAR(180);
