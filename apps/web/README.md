# Salabloco · front-end

Protótipo de alta fidelidade e funcional do app de reserva de salas de um coworking. Roda inteiro no navegador com um back-end simulado que aplica as mesmas regras do server real. Trocar para a API de verdade é uma variável de ambiente.

## Rodar

```bash
npm install
npm run dev        # http://127.0.0.1:5181
npm test           # regras de domínio e utilitários
npm run build      # typecheck + build de produção
```

Tokens de demonstração (aparecem na tela de login): `demo-acme-7f3a9c2e`, `demo-lumen-4b8d1e6a`, `demo-brisa-2c5f9a0d`.

O painel **Demo** (canto inferior esquerdo) simula carregando, erro e vazio e restaura os dados. Os dados ficam no `localStorage` e são recriados a cada dia.

## Usar a API real

```bash
VITE_API_MODE=http VITE_API_URL=http://localhost:3333 npm run dev
```

O client HTTP (`src/api/httpApi.ts`) espera o mesmo contrato do mock:

| Rota | Sucesso | Erros |
| --- | --- | --- |
| `GET /rooms` | 200 `Room[]` | 401 |
| `GET /rooms/:id/availability?date=AAAA-MM-DD` | 200 `{ busy: [{ startsAt, endsAt }] }` | 400, 401, 404 |
| `GET /companies/:id/bookings` | 200 `Booking[]` | 401, 403 |
| `POST /companies/:id/bookings` | 201 `Booking` | 400, 401, 403, 409, 422 |
| `DELETE /companies/:id/bookings/:bookingId` | 204 | 401, 403, 404 |

Header `Authorization: Bearer <token>`. Corpo de erro: `{ code, message, field?, conflict? }`. O login valida chamando `GET /companies/:id/bookings`.

## Estrutura

```
src/
├─ components/    shell, agenda, linha do tempo, rota protegida, ui/ (padrão shadcn)
├─ contexts/      sessão (sessionStorage) e tema
├─ hooks/         useAsync
├─ pages/         Login, Reservas, Mapa do dia, Nova reserva
├─ services/      contrato (types), mockApi, httpApi e createApi (trata 401 num só lugar)
├─ utils/         regras puras e testadas, esquemas zod, URLs, helpers
├─ App.tsx        provedores e rotas
└─ main.tsx
```

## Decisões

- **Domínio puro e sem relógio global.** `checkRules(input, now)` recebe o "agora". Os testes fixam a hora.
- **Intervalo semiaberto.** 10:00–11:00 e 11:00–12:00 coexistem.
- **Fuso do coworking.** Tudo é interpretado em `America/Sao_Paulo`, não no do navegador. A API guarda ISO em UTC. Teste cobre 23:30 local, que é o dia seguinte em UTC.
- **Expediente das 07:00 às 22:00.** Fora disso a reserva é recusada.
- **Disponibilidade sem dados de terceiros.** A API devolve só intervalos. O front cruza com as próprias reservas para pintar "sua empresa".
- **Reserva alheia no DELETE responde 404**, igual a inexistente.
- **Token em `sessionStorage`**, nunca em `localStorage`. Qualquer 401 vira logout e volta ao login com aviso.
- **Tailwind v4 + tokens no formato do shadcn/ui.** Os componentes de `ui/` seguem a API do shadcn. Dá para trocá-los pelos gerados com `npx shadcn add` sem mexer nas páginas.

## Pendente

- Back-end real (a pasta `tests/contract/bruno/` do projeto tem a coleção de requisições).
- i18n PT/EN, teste end-to-end com Playwright.
