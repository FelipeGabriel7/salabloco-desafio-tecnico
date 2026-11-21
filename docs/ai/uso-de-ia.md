# Uso de IA

Usei o Claude (Anthropic), em sessões de conversa. A IA me ajudou em três pontos. As decisões e o restante do código são meus.

## Onde usei IA

| Parte | O que pedi |
| --- | --- |
| Levantamento de requisitos | Organizar o enunciado em requisitos, regras de negócio e casos de borda |
| Interface | Desenhar o protótipo, o fluxo e as telas, a partir da direção visual que eu defini |
| Boilerplate do front-end | A base em React com API simulada: telas, formulário, mapa do dia e tratamento de conflito. É só o ponto de partida, e eu edito e evoluo o front a partir dele |

## Onde não usei

- **Decisões de arquitetura e segurança.** Os ADRs registram o que eu decidi. Pedi à IA só para listar alternativas, e a escolha foi minha.
- **API.** Escrevo eu mesmo.
- **Testes** (Vitest, Playwright, Bruno). Escrevo eu mesmo.
- **Front-end além do boilerplate.** Evoluo eu mesmo.

## Como me protejo dos riscos

| Risco | O que faço |
| --- | --- |
| Código que eu não entendo | Leio o boilerplate de ponta a ponta e só mantenho o que consigo explicar. A estrutura está no [ADR 0010](../arquitetura/adr/0010-frontend.md) |
| Teste que só confirma o que o código faz | Escrevo os casos de aceite a partir do enunciado, antes do código |
| Dependência ou configuração incorreta | Rodo instalação, testes e build de verdade |
| Dado pessoal em transcrição | Não versiono a transcrição bruta |
