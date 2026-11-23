# ADR 0012. Limite de requisições (429)

## Decisão

Protejo a API contra força bruta de token e esgotamento de recursos, com bloqueio temporário proporcional ao pico.

| Mecanismo | Protege contra | Regra inicial (configurável) |
| --- | --- | --- |
| Limite geral por IP, em **janela deslizante** | Rajadas | 100 requisições por minuto |
| Limite de falhas de autenticação por IP, com **bloqueio escalonado** | Descobrir o token por tentativa e erro | 10 respostas 401 em 5 minutos bloqueiam por 1 minuto. Reincidência dobra: 2, 4, 8 minutos |

- Respondo **429** com `Retry-After` (em segundos) e `code: RATE_LIMITED`.
- A janela deslizante evita o efeito de borda da janela fixa, e o bloqueio escalonado cresce com a reincidência.
- Tudo é configurável por ambiente (`RATE_LIMIT_*`, `AUTH_FAIL_*`, `AUTH_BLOCK_SECONDS`).
- O middleware fica em `apps/api/src/shared/rate-limit.ts` e é o **primeiro** do `app.ts`, antes da leitura do corpo e da autenticação, para limitar também quem não se autentica.
- Implementei sem biblioteca. O middleware conversa com um `RateLimitStore` de duas operações: `hit` (registra a requisição e diz quanto esperar) e `fail` (registra um 401 e bloqueia quando passa do limite).
- **Dois armazenamentos, escolhidos como o do banco:** em memória (local, testes e CI) e no Redis quando ele está configurado (Vercel). No Redis, cada operação é um script Lua atômico sobre *sorted sets* (`salabloco:rl:requests:<ip>` e `salabloco:rl:failures:<ip>`), com a chave de bloqueio expirando sozinha e o contador de reincidência guardado por 24 horas. Assim todas as instâncias da função contam juntas.
- A próxima requisição de um IP espera o registro de um 401 anterior terminar, para o bloqueio valer já na requisição seguinte.
- Na Vercel, ligo `trust proxy` para usar o IP real do cliente.

Atendo "proporcional ao pico" com escalonamento por reincidência, e não com um limite adaptativo à carga, que seria muito mais complexo.

## Consequências

- **Ganho:** barra força bruta e rajada com pouco código, e o `Retry-After` diz ao cliente o que fazer.
- **Custo:** no Redis, cada requisição faz uma chamada a mais ao Redis. Sem Redis, os contadores ficam em memória e valem por processo. O limite é por IP, então usuários atrás do mesmo NAT o compartilham, e atrás de proxy é preciso configurar `X-Forwarded-For`.
- **Testes** (`apps/api/tests/integration/rate-limit.test.ts`, rodando com contadores em memória e, no job do CI com Redis, também no Redis; e `rate-limit-app.test.ts`): 429 com `Retry-After` e `RATE_LIMITED` acima do limite; a janela deslizante libera quando a requisição mais antiga sai; outro IP não é afetado; falhas 401 seguidas bloqueiam e depois liberam; reincidência dobra o bloqueio; respostas de sucesso não contam como falha; a API real aplica o limite antes das rotas. Nos outros testes o limite é configurado alto, para não atrapalhar ([ADR 0011](0011-estrategia-de-testes.md)).
