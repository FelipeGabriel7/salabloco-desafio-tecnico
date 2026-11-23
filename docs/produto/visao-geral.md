# Visão geral

**Salabloco** é um app de reserva de salas de reunião de um coworking. Várias empresas dividem o espaço. Cada empresa reserva salas, vê as próprias reservas e cancela quando precisa. **Uma empresa nunca vê nem altera as reservas de outra.**

Projeto do desafio técnico para desenvolvedor júnior. O enunciado está em [requisitos.md](requisitos.md).

## Escopo

| Dentro | Fora |
| --- | --- |
| 5 rotas da API, 5 telas do front, validação | Cadastro de empresas e salas |
| Controle de acesso entre empresas | Edição ou reagendamento de reserva |
| Testes de regra (Vitest), API (Supertest) e interface (Playwright) | Reservas recorrentes |
| Seed de empresas e salas no JSON | Login com senha ou OAuth |
| Mapa do dia, conflito com sugestões, tema claro e escuro | |

## Como é avaliado

| Critério | Onde está tratado |
| --- | --- |
| Roda seguindo o README | README |
| Regras de negócio e bordas | [requisitos.md](requisitos.md), [qa.md](../qualidade/qa.md) |
| Organização e TypeScript | [arquitetura.md](../arquitetura/arquitetura.md) |
| Front-end | [ADR 0010](../arquitetura/adr/0010-frontend.md) |
| Segurança e dados | [seguranca.md](../qualidade/seguranca.md) |
| Testes além do caminho feliz | [qa.md](../qualidade/qa.md) |

## Glossário

| Termo | Significado |
| --- | --- |
| Empresa | Cliente do coworking. Tem um token fixo |
| Sala | Sala de reunião compartilhada, com nome e capacidade |
| Reserva | Empresa + sala + intervalo + título + e-mail do responsável |
| Intervalo semiaberto | `[início, fim)`. 10:00–11:00 e 11:00–12:00 não se sobrepõem |
| Horário ocupado | Visão pública de uma reserva: só início e fim |
| Expediente | 07:00 às 22:00 |
| BOLA | Acessar o objeto de outra empresa trocando o id |
