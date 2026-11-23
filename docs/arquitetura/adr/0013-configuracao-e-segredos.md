# ADR 0013. Configuração e segredos

## Decisão

**Nenhum segredo, chave, token ou parâmetro operacional fica no código**, porque o que vai para o git fica no histórico para sempre. Tudo vem de variáveis de ambiente.

| Arquivo | Versionado | Conteúdo |
| --- | --- | --- |
| `.env` | Não | Valores reais |
| `.env.example` | Sim | Todas as variáveis, com exemplos locais e um comentário em cada |

Há um par por aplicação: `apps/api`, `apps/web`, `tests` e a coleção Bruno. O `npm run setup` copia os exemplos quando o `.env` não existe.

### Regras

1. `process.env` só é lido em `apps/api/src/shared/config/env.ts`. O resto recebe a configuração tipada.
2. `loadConfig(env): AppConfig` é uma função pura: valida com zod e devolve uma interface. Os testes passam um objeto próprio.
3. **Falha rápida no boot:** variável ausente ou inválida impede o servidor de subir, e a mensagem lista o **nome** da variável, nunca o valor.
4. **Produção recusa valores de exemplo:** com `NODE_ENV=production`, um token igual ao do exemplo ou com menos de 24 caracteres impede o boot.
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
| `RATE_LIMIT_*`, `AUTH_FAIL_*`, `AUTH_BLOCK_SECONDS` | Limite de requisições ([ADR 0012](0012-limite-de-requisicoes.md)) |

## Consequências

- **Ganho:** nenhum segredo no repositório nem no histórico, trocar um token é mudar o ambiente, e a falha é rápida e clara.
- **Custo:** um passo a mais para rodar (`npm run setup`), mais código de validação no começo e o `.env.example` para manter em dia. Um teste falha se uma variável lida não estiver nele.
- **Verificações:** toda variável lida existe no `.env.example` (unitário); ambiente incompleto não sobe e não mostra valores (unitário); produção com valores de exemplo não sobe (unitário); `.env` fora do git (conferido no `git status`); sem token no bundle (SEG-14).
- **Fora do escopo:** cofre de segredos (Vault, AWS Secrets Manager) e rotação automática. Num ambiente real as variáveis viriam do cofre da plataforma, sem mudar o código.

No desenvolvimento, o Vite encaminha `/api` para a API. Em produção, o front e a API devem ser servidos sob a mesma origem.
