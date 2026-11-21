# Salabloco

Reserva de salas de reunião de um coworking. Cada empresa reserva salas, vê as próprias reservas e cancela quando precisa. Uma empresa nunca vê nem altera as reservas de outra.

> **Estado: em construção.** As especificações e as decisões (ADRs) estão prontas, e o front-end entrou como base. A API e os testes automatizados (Playwright) estão sendo construídos em par, passo a passo. Esta seção será reescrita quando o projeto rodar de ponta a ponta.

## Como rodar

Requisitos: Node 22 ou mais novo.

```bash
npm install
npm run setup           # copia os .env.example para .env (não sobrescreve)
npm run dev:mock        # front com a API simulada no navegador
npm test                # testes unitários
```

O `setup` cria os arquivos `.env` a partir dos `.env.example`. **O `.env` nunca vai para o git**, e **nenhum segredo fica no código** ([ADR 0013](docs/arquitetura/adr/0013-configuracao-e-segredos.md)). Os valores do `.env.example` são só de demonstração: em qualquer ambiente real, gere valores novos.

Os tokens de demonstração aparecem na tela de login (só no modo mock).

## Estrutura

```
apps/web/     front-end (React + Vite + TypeScript + Tailwind)
apps/api/     servidor (Express 5 + TypeScript)   [em construção]
tests/        Playwright, Bruno, Artillery         [em construção]
docs/         especificações, ADRs, QA, segurança, design
```

## Documentação

Tudo em [docs/](docs/README.md). Começos úteis:

- [Requisitos](docs/produto/requisitos.md) e [arquitetura](docs/arquitetura/arquitetura.md)
- [Decisões de arquitetura (ADRs)](docs/README.md)
- [Estratégia de QA](docs/qualidade/qa.md) e [segurança](docs/qualidade/seguranca.md)
- [Design (cores e tipografia)](docs/design/README.md)

## Decisões principais (resumo)

| Decisão | Motivo | Detalhe |
| --- | --- | --- |
| Express 5 | Familiaridade e erro de handler async tratado | [ADR 0001](docs/arquitetura/adr/0001-express.md) |
| MVC com service e repository, monólito modular | A regra de negócio não vaza para o controller | [ADR 0002](docs/arquitetura/adr/0002-estrutura-mvc-servico.md) |
| Persistência em arquivo JSON atrás de uma interface | Dados que sobrevivem, seed para testes, caminho para banco | [ADR 0003](docs/arquitetura/adr/0003-persistencia.md) |
| Escritas em fila, com a checagem de conflito dentro | Duas empresas nunca reservam a mesma sala | [ADR 0007](docs/arquitetura/adr/0007-concorrencia.md) |
| A empresa vem do token, nunca do front | Controle de acesso real entre empresas | [ADR 0005](docs/arquitetura/adr/0005-autenticacao.md) |
| 404 em vez de 403 para reserva alheia | Não confirma que o id existe | [ADR 0005](docs/arquitetura/adr/0005-autenticacao.md) |
| ISO com fuso explícito e `Intl` | Correto em qualquer época, ambíguo é rejeitado | [ADR 0006](docs/arquitetura/adr/0006-tempo-e-fuso.md) |
| Nenhum segredo no código | `.env` fora do git, `.env.example` versionado | [ADR 0013](docs/arquitetura/adr/0013-configuracao-e-segredos.md) |
| Enums e interfaces como contrato | O compilador exige status e mensagem para cada erro | [ADR 0014](docs/arquitetura/adr/0014-enums-e-interfaces.md) |

## O que ficou de fora

A ser preenchido ao final. Já sabemos que: tokens fixos não têm rotação nem revogação, a persistência em arquivo vale para um único processo, e não há trilha de auditoria. HTTPS é obrigatório em qualquer ambiente publicado e fica a cargo de quem publica.

## Uso de IA

A IA (Claude) foi usada no **levantamento de requisitos**, na **interface** (desenho das telas) e apenas no **boilerplate inicial do front-end mockado**. O front (a partir desse ponto), a API, os testes são desenvolvidos pelo autor. Detalhes em [docs/ai/uso-de-ia.md](docs/ai/uso-de-ia.md).
