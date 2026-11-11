CREATE TABLE historico_fichas_campo (
    id UUID NOT NULL PRIMARY KEY,
    canteiro_id VARCHAR(64) NOT NULL,
    usuario_id UUID,
    autor_nome VARCHAR(255),
    autor_papel VARCHAR(32),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_historico_ficha_canteiro
        FOREIGN KEY (canteiro_id) REFERENCES canteiros (id),
    CONSTRAINT fk_historico_ficha_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE INDEX idx_historico_ficha_canteiro_data_hora
    ON historico_fichas_campo (canteiro_id, data_hora DESC);

CREATE TABLE historico_fichas_campo_alteracoes (
    id UUID NOT NULL PRIMARY KEY,
    evento_id UUID NOT NULL,
    campo VARCHAR(80) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    CONSTRAINT fk_historico_ficha_alteracao_evento
        FOREIGN KEY (evento_id) REFERENCES historico_fichas_campo (id)
);

CREATE INDEX idx_historico_ficha_alteracao_evento
    ON historico_fichas_campo_alteracoes (evento_id);
