CREATE TABLE IF NOT EXISTS canteiros (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    codigo VARCHAR(32) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS canteiro_responsaveis (
    id UUID NOT NULL PRIMARY KEY,
    canteiro_id VARCHAR(64) NOT NULL,
    usuario_id UUID NOT NULL,
    ordem SMALLINT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_canteiro_responsavel_canteiro
        FOREIGN KEY (canteiro_id) REFERENCES canteiros (id),
    CONSTRAINT fk_canteiro_responsavel_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    CONSTRAINT uk_canteiro_responsavel_usuario
        UNIQUE (canteiro_id, usuario_id),
    CONSTRAINT uk_canteiro_responsavel_ordem
        UNIQUE (canteiro_id, ordem),
    CONSTRAINT ck_canteiro_responsavel_ordem
        CHECK (ordem BETWEEN 1 AND 3)
);

CREATE INDEX IF NOT EXISTS idx_canteiro_responsavel_usuario
    ON canteiro_responsaveis (usuario_id);

CREATE TABLE IF NOT EXISTS fichas_campo (
    id UUID NOT NULL PRIMARY KEY,
    canteiro_id VARCHAR(64) NOT NULL UNIQUE,
    grupo TEXT,
    canteiro_codigo VARCHAR(32),
    cultura TEXT,
    data_plantio VARCHAR(32),
    espacamento TEXT,
    plantas_por_canteiro TEXT,
    plantas_por_ha TEXT,
    previsao_colheita VARCHAR(32),
    adubacao TEXT,
    controle_pragas TEXT,
    limpa_capina TEXT,
    observacoes TEXT,
    status_entrega VARCHAR(32) NOT NULL DEFAULT 'pendente',
    data_entrega VARCHAR(32),
    visto_assinado BOOLEAN NOT NULL DEFAULT FALSE,
    data_visto VARCHAR(32),
    parecer TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    CONSTRAINT fk_ficha_canteiro
        FOREIGN KEY (canteiro_id) REFERENCES canteiros (id),
    CONSTRAINT fk_ficha_updated_by
        FOREIGN KEY (updated_by) REFERENCES usuarios (id)
);

INSERT INTO canteiros (id, codigo, nome) VALUES
    ('c-01', 'C01', 'Canteiro 01'),
    ('c-02', 'C02', 'Canteiro 02'),
    ('c-03', 'C03', 'Canteiro 03'),
    ('c-04', 'C04', 'Canteiro 04'),
    ('c-05', 'C05', 'Canteiro 05'),
    ('c-06', 'C06', 'Canteiro 06'),
    ('c-07', 'C07', 'Canteiro 07'),
    ('c-08', 'C08', 'Canteiro 08'),
    ('c-09', 'C09', 'Canteiro 09'),
    ('c-10', 'C10', 'Canteiro 10'),
    ('c-11', 'C11', 'Canteiro 11'),
    ('c-12', 'C12', 'Canteiro 12'),
    ('c-13', 'C13', 'Canteiro 13'),
    ('c-14', 'C14', 'Canteiro 14'),
    ('c-15', 'C15', 'Canteiro 15'),
    ('c-16', 'C16', 'Canteiro 16'),
    ('c-17', 'C17', 'Canteiro 17'),
    ('c-18', 'C18', 'Canteiro 18'),
    ('c-19', 'C19', 'Canteiro 19'),
    ('c-20', 'C20', 'Canteiro 20'),
    ('c-21', 'C21', 'Canteiro 21'),
    ('c-22', 'C22', 'Canteiro 22'),
    ('c-23', 'C23', 'Canteiro 23'),
    ('c-24', 'C24', 'Canteiro 24'),
    ('med-01', 'MED01', 'Medicinais 01'),
    ('med-02', 'MED02', 'Medicinais 02'),
    ('med-03', 'MED03', 'Medicinais 03'),
    ('composteira', 'COMP', 'Composteira'),
    ('recepcao', 'REC', 'Recepção'),
    ('minhocario', 'MINH', 'Minhocário'),
    ('agua', 'AGUA', 'Captação de água')
ON CONFLICT (id) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nome = EXCLUDED.nome;
