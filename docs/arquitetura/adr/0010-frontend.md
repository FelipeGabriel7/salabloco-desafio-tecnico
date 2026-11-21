# ADR 0010. Front-end simples e explicável

## Decisão

Meu princípio: **código simples e explicável**. Uma aplicação pequena não precisa de uma arquitetura grande.

| Peça | Escolha |
| --- | --- |
| Base | React 18, Vite e TypeScript |
| Rotas | react-router, declaradas em `App.tsx`; URLs em `utils/paths.ts` |
| Formulários | react-hook-form + zod; esquemas e regras em `utils/` |
| Dados | Hook próprio `useAsync` |
| Tema | Context (`ThemeProvider`), com a classe `dark` aplicada por `useLayoutEffect`. Sem script inline no `index.html`, o que permite CSP estrita |
| Estilo | Tailwind |
| Testes | Vitest (unitários) e Playwright (interface) |

Mantenho só estas pastas:

```
apps/web/src/
├─ components/   componentes reutilizáveis (inclui a rota protegida)
├─ contexts/     sessão e tema
├─ hooks/        useAsync
├─ pages/        telas
├─ services/     cliente HTTP, cliente simulado (mock) e contrato
├─ utils/        regras puras, esquemas, URLs, helpers
├─ App.tsx       provedores e rotas
└─ main.tsx
```

`services/` é o único ponto de contato com o servidor. Ele tem o cliente HTTP real e um cliente simulado, que replica as regras no navegador e permite desenvolver e demonstrar sem o back-end (`npm run dev:mock`).

### Princípios

1. O servidor é a fonte da verdade. O front valida só para responder rápido, e todo erro da API volta para o campo certo.
2. Componentes não chamam `fetch`, e qualquer 401 encerra a sessão num ponto só.
3. Todo dado assíncrono tem três estados: carregando, erro (com "tentar novamente") e vazio.
4. O conflito é tratado de ponta a ponta: aviso, alerta com foco, disponibilidade recarregada e sugestões do servidor.
5. Na agenda do dia, o horário é escolhido em dois cliques (início e fim), com alerta para menos de 30 minutos ou mais de 4 horas.
6. Acessibilidade: foco visível, alvos de toque de 44 px, `aria-live` e axe-core no Playwright.

Cores e tipografia estão em [design](../../design/README.md). Design não é critério do desafio, é diferencial.

## Consequências

- **Ganho:** poucas pastas e pouca indireção, o que me deixa explicar qualquer arquivo na entrevista.
- **Custo:** o mock duplica regras que também existem no servidor. Se ficar complexo, simplifico.
- **Pendências:** remover `utils/suggest.ts` (as sugestões passam a vir do servidor, [ADR 0008](0008-contrato-de-erros.md)), migrar `utils/time.ts` para `Intl` ([ADR 0006](0006-tempo-e-fuso.md)) e manter uma cópia própria do enum `ErrorCode` ([ADR 0014](0014-enums-e-interfaces.md)).
