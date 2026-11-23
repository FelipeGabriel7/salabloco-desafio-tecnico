# ADR 0016. Redis na hospedagem, arquivo no ambiente local

## Decisão

Quando as credenciais estão configuradas, a API pode guardar os dados em **Redis gerenciado**. Sem elas, usa arquivo JSON, inclusive na Vercel. A configuração efetiva de produção deve ser verificada no provedor.

A escolha é automática: a API aceita `KV_REST_API_URL`/`KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Se não houver URL e token, usa o arquivo de `DB_PATH`; na Vercel, o padrão é `/tmp/salabloco.json`, temporário e isolado por instância.

O repository não mudou. Ele depende de um `Storage` com quatro operações, e cada implementação resolve do seu jeito:

| Operação | Arquivo (`file-storage.ts`) | Redis (`redis-storage.ts`) |
| --- | --- | --- |
| `read` | lê o `db.json` | `GET salabloco:db` |
| `save` | grava `.tmp` e renomeia | `SET salabloco:db` |
| `exclusive` | fila em memória ([ADR 0007](0007-concorrencia.md)) | trava `SET salabloco:lock NX PX 5000` |
| `snapshot` | leitura dentro da fila | `GET`, que já é atômico |

A trava guarda um id aleatório e só é liberada por quem a criou (script Lua que confere o dono antes de apagar). Ela expira em 5 segundos, para não ficar presa se a função cair no meio.

Para que a expiração não abra brecha, **a gravação também confere o dono da trava**. Dentro de `exclusive`, o `save` roda um script Lua que só faz o `SET` se a trava ainda pertencer àquela operação. Se a operação demorou mais de 5 segundos e outra instância assumiu a trava, a gravação é recusada e a operação falha, em vez de sobrescrever dados com uma versão antiga. Há teste de unidade para esse caso.

## Por quê

Na Vercel a API é uma função serverless: o `/tmp` some quando a função é reciclada, e cada instância tem o próprio disco e a própria fila. Resultado: reservas sumindo e, pior, duas instâncias podendo aceitar a mesma sala no mesmo horário. O dado e a trava precisavam sair da função.

## Consequências

- **Ganho:** com Redis configurado, os dados são compartilhados entre instâncias e não dependem do `/tmp` de uma função.
- **Garantia:** checagem de conflito e gravação acontecem sob a mesma trava, e uma gravação atrasada é recusada. Assim, duas instâncias não aceitam a mesma sala no mesmo horário.
- **Ganho:** a troca ficou só na infraestrutura. Services, controllers, regras e front não mudaram, como o [ADR 0003](0003-persistencia.md) previa.
- **Custo:** a cada escrita o banco inteiro é lido e regravado, como no arquivo. Neste volume não pesa.
- **Custo:** escritas viram sequenciais entre todas as instâncias. Para um coworking é aceitável.

## Alternativas descartadas

- **Postgres (Neon):** é o destino natural em escala, com transação e constraint de exclusão no banco, mas exigiria reescrever o repository em SQL.
- **Vercel Blob:** guarda o arquivo, mas não oferece trava; a concorrência ficaria sem garantia.
- **Render ou Railway com disco persistente:** um segundo provedor, e ainda uma instância só.
