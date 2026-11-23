# Salabloco · front-end

Front-end React do app de reserva de salas. As regras e os dados vêm da API Express.

## Rodar

```bash
npm run setup
npm run dev        # API e web juntos
npm test           # componentes e formatos de formulário/tempo
npm run build      # typecheck + build de produção
```

Use os tokens configurados em `apps/api/.env`; o front não inclui tokens no bundle.

No desenvolvimento, o Vite encaminha `/api` para `http://localhost:3333`. O front usa Axios; configure `VITE_API_URL` somente se a API estiver em outra origem fora do desenvolvimento. `VITE_THEME_STORAGE_KEY` configura apenas a preferência visual de tema.

Para persistir o tema, defina `VITE_THEME_STORAGE_KEY` em `apps/web/.env`; se ela estiver ausente, o app usa tema claro sem gravar essa preferência.

| Rota | Sucesso | Erros |
| --- | --- | --- |
| `GET /api/companies` | 200 `Company[]` | - |
| `GET /api/config` | 200 `{ timezone }` | 401 |
| `GET /api/rooms` | 200 `Room[]` | - |
| `GET /api/rooms/:id/availability?date=AAAA-MM-DD` | 200 `{ busy: [{ startsAt, endsAt }] }` | 400, 401, 404 |
| `GET /api/companies/:id/bookings` | 200 `Booking[]` | 401, 403 |
| `POST /api/companies/:id/bookings` | 201 `Booking` | 400, 401, 403, 409, 422 |
| `PUT /api/companies/:id/bookings/:bookingId` | 200 `Booking` | 400, 401, 403, 404, 409, 422 |
| `DELETE /api/companies/:id/bookings/:bookingId` | 204 | 401, 403, 404 |

O login carrega empresas em `GET /api/companies`; depois valida token e timezone na API. O token e a sessão ficam só em memória. Salas/empresas vêm do servidor, sem mocks no front.

## Estrutura

```
src/
├─ components/    navegação, estados de tela e componentes ui
├─ contexts/      sessão em memória e tema
├─ hooks/         useAsync
├─ pages/         Login, Reservas, Mapa do dia, Nova reserva
├─ services/      chamadas Axios, tipos da API e conversão de horário
├─ routes.ts      caminhos React e prefill da reserva
├─ App.tsx        provedores e rotas
└─ main.tsx
tests/            testes unitários do front
```

## Decisões

- **Servidor como fonte da verdade.** O front valida os campos do formulário; o back-end aplica as regras de reserva.
- **Intervalo semiaberto.** 10:00–11:00 e 11:00–12:00 coexistem.
- **Fuso do coworking.** O front busca `timezone` em `/api/config`; a API guarda instantes ISO em UTC.
- **Expediente das 07:00 às 22:00.** Fora disso a reserva é recusada.
- **Disponibilidade sem dados de terceiros.** A API devolve só intervalos ocupados, sem título, e-mail ou empresa.
- **Reserva alheia no DELETE responde 404**, igual a inexistente.
- **Token só em memória React.** Ao atualizar a página, a pessoa precisa entrar novamente.
- **Tailwind v4 + tokens no formato do shadcn/ui.** Os componentes de `ui/` seguem a API do shadcn. Dá para trocá-los pelos gerados com `npx shadcn add` sem mexer nas páginas.

## Pendente

- Testes end-to-end com Playwright.
