# ADR 0013. Configuração e segredos

## Decisão

Credenciais de empresa e conexão devem vir do ambiente, porque o que vai para o git fica no histórico. Existem valores locais fictícios em `.env.example` e nos scripts de teste; eles não devem ser usados como credenciais reais.

| Arquivo | Versionado | Conteúdo |
| --- | --- | --- |
| `.env` | Não | Valores reais |
| `.env.example` | Sim | Todas as variáveis, com exemplos locais e um comentário em cada |

Há um par por aplicação: `apps/api`, `apps/web`, `tests` e a coleção Bruno. O `npm run setup` copia os exemplos quando o `.env` não existe.

### Regras

1. O back-end lê a configuração principal em `apps/api/src/shared/config.ts`. O código de hospedagem também consulta variáveis de ambiente.
2. `config.ts` exporta um objeto; não há `loadConfig` puro nem validação Zod completa do ambiente.
3. Os três tokens de empresa ausentes impedem a inicialização. A mensagem não inclui os valores.
4. A implementação atual **não recusa automaticamente** tokens de exemplo ou curtos em produção; configure valores próprios e fortes.
5. Tokens são lidos do ambiente para memória e nunca vão para código, `db.json`, log ou resposta. Para este desafio, a API compara o token diretamente; um produto real deve guardar hashes e comparar em tempo constante ([ADR 0005](0005-autenticacao.md)).
6. Carrego o ambiente com `node --env-file=.env`, sem a dependência `dotenv`.

### Front-end

No Vite, toda variável `VITE_*` vai para o JavaScript e é pública. Por isso o front nunca recebe segredo: o token é digitado no login. `VITE_API_URL` aponta para a origem da API em produção; em desenvolvimento o Vite encaminha `/api` para o servidor local.

### Variáveis da API

O contrato completo está em [`apps/api/.env.example`](../../../apps/api/.env.example).

| Variável | Para quê |
| --- | --- |
| `NODE_ENV`, `PORT` | Ambiente e porta |
| `COWORKING_TIMEZONE` | Fuso ([ADR 0006](0006-tempo-e-fuso.md)) |
| `DB_PATH` | Arquivo de dados ([ADR 0003](0003-persistencia.md)) |
| `COMPANY_<ID>_TOKEN` | Token de cada empresa |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Conexão Redis; alternativas Upstash descritas no [ADR 0016](0016-redis-na-hospedagem.md) |

## Consequências

- **Ganho:** trocar tokens ou conectar Redis não exige embuti-los no front.
- **Custo:** é preciso configurar o ambiente e manter os exemplos atualizados. O código atual não verifica força do token nem exige Redis em produção.
- **Atenção:** `.gitignore` não remove arquivos já rastreados. Confira o histórico e o status antes de concluir que um arquivo ou segredo não foi versionado.
- **Fora do escopo:** cofre de segredos (Vault, AWS Secrets Manager) e rotação automática. Num ambiente real as variáveis viriam do cofre da plataforma, sem mudar o código.

No desenvolvimento, o Vite encaminha `/api` para a API. Em produção, o front e a API devem ser servidos sob a mesma origem.
