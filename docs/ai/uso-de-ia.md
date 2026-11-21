# Uso de IA

Ferramenta: Claude (Anthropic), em sessões de conversa.

## Onde a IA foi usada

| Parte | Uso |
| --- | --- |
| Levantamento de requisitos | Organização do enunciado em requisitos, regras e casos de borda |
| Interface | Protótipo navegável, fluxo do usuário e telas, a partir da direção visual do autor |
| Boilerplate inicial do front-end mockado | Base em React com API simulada, telas, formulário, mapa do dia e tratamento de conflito. É só o ponto de partida: o autor edita e evolui o front |

## Onde não foi usada

O **front-end** (além do boilerplate inicial), a **API**, e os **testes** (Vitest, Playwright, Bruno) são desenvolvidos pelo autor. As decisões de arquitetura e segurança (ADRs) são do autor; a IA foi usada para listar alternativas.

## Controle

| Risco | Tratamento |
| --- | --- |
| Código que o autor não entende | O boilerplate do front é lido de ponta a ponta e editado pelo autor (estrutura em [ADR 0010](../arquitetura/adr/0010-frontend.md)) |
| Teste que só confirma o que o código faz | Casos de aceite escritos a partir do enunciado, antes do código |
| Dependência ou configuração incorreta | Instalação, testes e build executados de fato |
| Dado pessoal em transcrição | A transcrição bruta não é versionada |
