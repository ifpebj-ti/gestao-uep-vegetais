-- Contas de teste solicitadas para validacao dos perfis no ambiente publicado.
-- As senhas estao armazenadas como BCrypt, no mesmo formato usado pela aplicacao.
-- ON CONFLICT preserva qualquer conta preexistente com o mesmo e-mail.
INSERT INTO usuarios (
    id,
    nome,
    email,
    senha,
    role,
    email_verificado,
    confirmacao_novo_email_pendente,
    ativo,
    versao_sessao,
    uep,
    criado_em
)
VALUES
    (
        gen_random_uuid(),
        'alunoteste',
        'alunoteste@discente.ifpe.edu.br',
        '$2a$10$7eGHLf20eyWRGUocoV4FmO295xGLQVfpUVVR5gbOaRCimBhSFhBu2',
        'ALUNO',
        TRUE,
        FALSE,
        TRUE,
        0,
        NULL,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'professorteste',
        'professorteste+novo@belojardim.ifpe.edu.br',
        '$2a$10$AFkvAcRYVJuJoeHBOQT/ruz.H42FtV.Bpe7u5w2HbR6UapphxJESC',
        'PROFESSOR',
        TRUE,
        FALSE,
        TRUE,
        0,
        'olericultura',
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'admteste',
        'admteste@belojardim.ifpe.edu.br',
        '$2a$10$SAwDq9.xaR7STL3/HLxZTOMbkMbHhgF7Hmx9iETnz3DOLqcwfFriy',
        'ADMIN',
        TRUE,
        FALSE,
        TRUE,
        0,
        NULL,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (email) DO NOTHING;
