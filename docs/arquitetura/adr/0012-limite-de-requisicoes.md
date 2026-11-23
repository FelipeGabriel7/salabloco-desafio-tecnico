# ADR 0012. Limite de requisições (429)

> **Status: proposta, não implementada.** O conteúdo abaixo descreve uma alternativa planejada, não um controle existente. A API atual não registra middleware de rate limit nem retorna `429` por esse motivo.

## Decisão

Protejo a API contra força bruta de token e esgotamento de recursos, com bloqueio temporário proporcional ao pico.

| Mecanismo | Protege contra | Regra inicial (configurável) |
| --- | --- | --- |
| Limite geral por IP, em **janela deslizante** | Rajadas | 100 requisições por minuto |
| Limite de falhas de autenticação por IP, com **bloqueio escalonado** | Descobrir o token por tentativa e erro | 10 respostas 401 em 5 minutos bloqueiam por 1 minuto. Reincidência dobra: 2, 4, 8 minutos |

- Respondo **429** com `Retry-After` (em segundos) e `code: RATE_LIMITED`.
- A janela deslizante evita o efeito de borda da janela fixa, e o bloqueio escalonado cresce com a reincidência.
- Tudo é configurável por ambiente (`RATE_LIMIT_*`, `AUTH_FAIL_*`, `AUTH_BLOCK_SECONDS`).
- O middleware fica em `apps/api/src/shared/middlewares/rate-limit.ts`, **antes** da autenticação, para limitar também quem não se autentica.
- Uso `express-rate-limit` para a janela e uma camada própria para o escalonamento. O armazenamento é em memória, atrás de uma interface que dá para trocar por Redis.

Atendo "proporcional ao pico" com escalonamento por reincidência, e não com um limite adaptativo à carga, que seria muito mais complexo.

## Consequências

- **Ganho:** barra força bruta e rajada com pouco código, e o `Retry-After` diz ao cliente o que fazer.
- **Custo:** por estar em memória, vale para uma instância só. O limite é por IP, então usuários atrás do mesmo NAT o compartilham, e atrás de proxy é preciso configurar `X-Forwarded-For`.
- **Testes:** 429 com `Retry-After` acima do limite (API); 10 tokens errados bloqueiam e depois liberam (API); reincidência dobra o bloqueio (unitário); outro IP não é afetado (API). Nos testes normais o limite não atrapalha ([ADR 0011](0011-estrategia-de-testes.md)).
