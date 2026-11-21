# ADR 0010. Front-end

**Meu princípio:** código simples e explicável. Uma aplicação pequena não precisa de uma arquitetura grande.

## Contexto

O front consome a API e cobre: escolha de empresa, formulário com validação, listagem com cancelamento, agenda por dia e os estados de carregando, erro e vazio. Usei IA para gerar o boilerplate inicial (com API simulada) a partir do desenho de interface; daí em diante o front é desenvolvido por mim ([uso de IA](../../ai/uso-de-ia.md)).

## Decisão

| Peça | Escolha |
| --- | --- |
| Base | React 18 + Vite + TypeScript |
| Rotas | react-router, declaradas em `App.tsx`. URLs em `utils/paths.ts` |
| Formulários | react-hook-form + zod. Esquemas e regras de negócio em `utils/` |
| Dados | Hook próprio `useAsync` |
| Tema | Context (`ThemeProvider`); a classe `dark` é aplicada por `useLayoutEffect`. Sem script inline no `index.html`, o que permite CSP estrita |
| Estilo | Tailwind |
| Testes | Vitest (unitários) e Playwright (interface) |

Mantenho seis pastas, e nada além:

```
apps/web/src/
├─ components/   componentes reutilizáveis (inclui a rota protegida)
├─ contexts/     sessão e tema (Context API)
├─ hooks/        useAsync
├─ pages/        telas
├─ services/     cliente HTTP, cliente simulado (mock) e contrato
├─ utils/        regras puras, esquemas dos formulários, URLs, helpers
├─ App.tsx       provedores e rotas
└─ main.tsx
```

`services/` é o único ponto de contato com o servidor: cliente HTTP real e cliente simulado (mock), que replica as regras no navegador e permite desenvolver e demonstrar sem o back-end (`npm run dev:mock`).

## Princípios

1. O servidor é a fonte da verdade. O front valida para dar resposta rápida, e todo erro da API volta para o campo certo.
2. Componentes não chamam `fetch`. Qualquer 401 encerra a sessão em um ponto só.
3. Todo dado assíncrono tem três estados: carregando, erro (com "tentar novamente") e vazio.
4. Trato o conflito de ponta a ponta: aviso, alerta com foco, disponibilidade recarregada e sugestões do servidor.
5. Na agenda do dia, o horário é escolhido em dois cliques (início e fim), com alerta para menos de 30 minutos ou mais de 4 horas.
6. Acessibilidade: foco visível, alvos de toque de 44 px, `aria-live`, axe-core no Playwright.

## Pendências

| Item | Motivo |
| --- | --- |
| Remover `utils/suggest.ts` | As sugestões passam a vir do servidor ([ADR 0008](0008-contrato-de-erros.md)) |
| Migrar `utils/time.ts` para `Intl` | Alinhar ao [ADR 0006](0006-tempo-e-fuso.md) |
| Cópia própria do enum `ErrorCode` | O front traduz erros por `code` ([ADR 0014](0014-enums-e-interfaces.md)) |
| Simplificar mapa vertical e mock se ficarem complexos | Manter o código explicável |

## Identidade visual

Cores e tipografia em [design](../../design/README.md). Design não é critério do desafio: é diferencial.
