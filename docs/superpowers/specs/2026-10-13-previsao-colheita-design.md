# Especificação: previsão de colheita por canteiro

## Objetivo

Permitir que o Terrarium estime, em quilogramas, quanto uma cultura poderá
produzir no momento da colheita de cada canteiro. A estimativa deve considerar
a cultura/variedade, o espaçamento, a área do canteiro, as plantas por canteiro
ou por hectare, a produtividade agronômica e o fator de aproveitamento.

O cálculo será feito no back-end, persistido junto à ficha do canteiro e
exibido no front-end. O professor poderá manter os parâmetros agronômicos; os
alunos responsáveis poderão consultar a previsão na ficha que podem editar.

## Contexto e premissas

Os documentos de referência indicam que o modelo de cultivo deve armazenar
espaçamento, ciclo, produtividade esperada, unidade de comercialização e
aproveitamento. Eles também alertam que os valores precisam ser ajustáveis às
condições locais.

O sistema atual guarda parte desses dados como texto na `fichas_campo` e usa
uma densidade genérica de 16 plantas/m² para preencher a ficha. Essa densidade
genérica não será usada para uma previsão oficial.

## Modelo agronômico

Será criada a entidade `modelo_cultivo`, gerenciada exclusivamente por
professores, contendo:

- cultura e variedade;
- espaçamento entre linhas e entre plantas, em metros;
- produtividade por planta, em kg, quando a cultura for comercializada em kg;
- peso médio por unidade, em kg, quando a cultura for comercializada por
  unidade ou maço;
- unidade de produção (`KG`, `UNIDADE` ou `MACO`);
- fator de aproveitamento entre 0 e 1;
- situação ativa/inativa e campos de auditoria.

As fichas de campo receberão a referência ao modelo usado e guardarão um
snapshot da previsão calculada, para que uma alteração posterior no catálogo
não altere silenciosamente registros históricos.

## Fórmula

1. Densidade pelo espaçamento:

   `plantasPorM2 = 1 / (espacamentoEntreLinhasM * espacamentoEntrePlantasM)`

2. Plantas estimadas, usando a melhor informação disponível nesta ordem:

   - plantas por canteiro informadas;
   - área do canteiro × plantas por hectare / 10.000;
   - área do canteiro × plantas por m² calculadas pelo espaçamento.

3. Produção bruta:

   - unidade `KG`: `plantasEstimadas × produtividadeKgPorPlanta`;
   - unidade `UNIDADE` ou `MACO`: `plantasEstimadas × pesoMedioKgPorUnidade`.

4. Previsão final:

   `kgPrevistos = producaoBruta × fatorAproveitamento`

O resultado será arredondado para duas casas decimais. Se faltar produtividade
ou peso médio compatível com a unidade, a API retornará a ficha sem previsão e
uma mensagem explicando quais dados faltam.

Quando plantas por canteiro, plantas por hectare e espaçamento forem
informados simultaneamente, o serviço também calculará a divergência entre
eles. Uma diferença superior a 10% gerará um aviso, mas não impedirá o
salvamento, pois o professor pode estar registrando uma condição real de
campo.

## Persistência e API

Será adicionada uma migração Flyway para:

- criar `modelos_cultivo`;
- adicionar à ficha o modelo utilizado, a área considerada, a quantidade de
  plantas estimada, a previsão em kg, a data do cálculo e avisos de consistência;
- inserir modelos iniciais baseados nos dados de referência disponíveis para
  abobrinha, alface, batata, cenoura, beterraba, brócolo e cebolinha.

Endpoints previstos:

- `GET /api/modelos-cultivo`: lista modelos ativos para seleção;
- `POST /api/modelos-cultivo`: cria modelo, somente professor;
- `PUT /api/modelos-cultivo/{id}`: atualiza modelo, somente professor;
- `GET /api/canteiros/{id}/ficha`: inclui a previsão persistida;
- `PUT /api/canteiros/{id}/ficha`: recalcula e salva a previsão quando os
  parâmetros da ficha forem alterados.

O cálculo do servidor será a fonte de verdade. O front-end poderá mostrar uma
prévia enquanto o professor preenche os campos, mas deverá atualizar o valor
com a resposta da API após salvar.

## Interface

Na ficha do canteiro será incluída uma seção “Previsão de colheita” contendo:

- cultura/modelo selecionado;
- espaçamento e área considerada;
- plantas estimadas;
- produtividade ou peso médio utilizado;
- fator de aproveitamento;
- resultado em kg;
- aviso de inconsistência ou de dados incompletos.

O valor será apresentado como estimativa, não como garantia de produção. A
pesagem real da colheita permanece um dado futuro e não será criada nesta
etapa.

## Validações e permissões

- espaçamentos, área, produtividade e peso médio devem ser maiores que zero;
- fator de aproveitamento deve estar entre 0 e 1;
- professor pode criar e alterar modelos;
- aluno não pode alterar o catálogo agronômico;
- leitura da previsão segue a autorização já existente para a ficha do
  canteiro;
- o canteiro continua podendo ser editado somente pelo professor ou pelos
  alunos responsáveis já cadastrados.

## Testes

Serão adicionados testes para:

- cálculo por kg por planta;
- cálculo por peso médio por unidade;
- prioridade entre plantas por canteiro, plantas por hectare e espaçamento;
- fator de aproveitamento e arredondamento;
- rejeição de parâmetros inválidos;
- aviso de divergência superior a 10%;
- autorização de professor e aluno;
- persistência da previsão após reinício do PostgreSQL;
- exibição do resultado e do aviso na ficha do front-end.

## Fora do escopo desta etapa

- escalonamento semanal de plantios;
- recálculo automático por perdas ocorridas durante o ciclo;
- registro de pesagem real e calibração automática dos modelos;
- funcionamento offline-first;
- previsão financeira ou de preço de venda.
