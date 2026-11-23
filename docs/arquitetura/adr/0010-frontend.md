# ADR 0010. Front-end simples e explicável

## Decisão

Meu princípio: **código simples e explicável**. Uma aplicação pequena não precisa de uma arquitetura grande.

| Peça | Escolha |
| --- | --- |
| Base | React 18, Vite e TypeScript |
| Rotas | react-router em `App.tsx`; paths em `src/routes.ts` |
| Formulários | react-hook-form + zod; schemas perto de cada página |
| Dados | `useAsync` para carregamento e funções Axios por endpoint |
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
├─ services/     Axios, tipos da API e conversão de horário
├─ routes.ts     paths React e prefill de navegação
├─ App.tsx       provedores e rotas
└─ main.tsx
```

Os testes unitários ficam em `apps/web/tests/`, separados das telas.

`services/` é o único ponto de contato com o servidor. As funções Axios chamam a API Express em `/api`; no desenvolvimento o Vite usa proxy para evitar CORS manual.

### Princípios

1. O servidor é a fonte da verdade. O front valida os campos básicos; as regras finais são aplicadas pela API.
2. Componentes não fazem chamadas HTTP diretamente; usam as funções em `services/httpApi.ts`.
3. Todo dado assíncrono tem três estados: carregando, erro (com "tentar novamente") e vazio.
4. O conflito é tratado com a mensagem e as sugestões enviadas pelo servidor; a disponibilidade é carregada de novo.
5. O formulário usa campos explícitos para data, início e fim. O servidor decide se o intervalo pode ser reservado.
6. Acessibilidade: foco visível, alvos de toque de 44 px, `aria-live` e axe-core no Playwright.

Cores e tipografia estão em [design](../../design/README.md). Design não é critério do desafio, é diferencial.

## Consequências

- **Ganho:** poucas pastas e chamadas HTTP diretas pelo cliente Axios; catálogo e horários vêm da API, sem mocks no bundle.
- **Custo:** a API precisa estar ativa para usar o front.
