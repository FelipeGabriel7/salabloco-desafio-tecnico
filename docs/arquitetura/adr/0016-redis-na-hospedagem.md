# ADR 0016. Redis na hospedagem, arquivo no ambiente local

## Decisão

Na Vercel, a API guarda os dados num **Redis gerenciado (Upstash, pelo Marketplace da Vercel)**. Local, testes e CI continuam com o **arquivo JSON**.

A escolha é automática: se `KV_REST_API_URL` e `KV_REST_API_TOKEN` existem no ambiente, a API usa o Redis; se não, usa o arquivo de `DB_PATH`. Quem cria essas variáveis é a própria integração da Vercel, então nenhum valor passa por mim nem fica no código.

O repository não mudou. Ele depende de um `Storage` com quatro operações, e cada implementação resolve do seu jeito:

| Operação | Arquivo (`file-storage.ts`) | Redis (`redis-storage.ts`) |
| --- | --- | --- |
| `read` | lê o `db.json` | `GET salabloco:db` |
| `save` | grava `.tmp` e renomeia | `SET salabloco:db` |
| `exclusive` | fila em memória ([ADR 0007](0007-concorrencia.md)) | trava `SET salabloco:lock NX PX 5000` |
| `snapshot` | leitura dentro da fila | `GET`, que já é atômico |

A trava guarda um id aleatório e só é liberada por quem a criou (script Lua que confere o dono antes de apagar). Se a função cair no meio, a trava expira em 5 segundos.

## Por quê

Na Vercel a API é uma função serverless: o `/tmp` some quando a função é reciclada, e cada instância tem o próprio disco e a própria fila. Resultado: reservas sumindo e, pior, duas instâncias podendo aceitar a mesma sala no mesmo horário. O dado e a trava precisavam sair da função.

## Consequências

- **Ganho:** reservas persistem e a regra "uma sala, um horário" volta a valer entre instâncias.
- **Ganho:** a troca ficou só na infraestrutura. Services, controllers, regras e front não mudaram, como o [ADR 0003](0003-persistencia.md) previa.
- **Custo:** a cada escrita o banco inteiro é lido e regravado, como no arquivo. Neste volume não pesa.
- **Custo:** escritas viram sequenciais entre todas as instâncias. Para um coworking é aceitável.

## Alternativas descartadas

- **Postgres (Neon):** é o destino natural em escala, com transação e constraint de exclusão no banco, mas exigiria reescrever o repository em SQL.
- **Vercel Blob:** guarda o arquivo, mas não oferece trava; a concorrência ficaria sem garantia.
- **Render ou Railway com disco persistente:** um segundo provedor, e ainda uma instância só.
