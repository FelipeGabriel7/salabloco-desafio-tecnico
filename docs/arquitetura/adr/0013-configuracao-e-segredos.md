# ADR 0013. Configuração e segredos

## Contexto

Chave ou token escrito no código vai para o git, fica no histórico para sempre, aparece em qualquer clone e não dá para trocar sem republicar. O enunciado fala em token fixo por empresa, o que poderia levar a deixá-lo no código. Não quero isso.

## Decisão

**Nenhum segredo, chave, token ou parâmetro operacional fica no código.** Tudo vem de variáveis de ambiente.

| Arquivo | Versionado | Conteúdo |
| --- | --- | --- |
| `.env` | Não (`.gitignore`) | Valores reais |
| `.env.example` | Sim | Todas as variáveis, com valores de demonstração e um comentário em cada |

Há um par por aplicação: `apps/api`, `apps/web`, `tests` e a coleção Bruno. O `npm run setup` copia os exemplos quando o `.env` não existe.

### Regras

1. `process.env` só é lido em `apps/api/src/shared/config/env.ts`. O resto recebe a configuração tipada.
2. `loadConfig(env): AppConfig` é uma função pura: valida com zod e devolve uma interface. Os testes passam um objeto próprio.
3. **Falha rápida no boot:** variável ausente ou inválida impede o servidor de subir, listando o **nome** da variável e nunca o valor.
4. **Produção recusa valores de exemplo:** com `NODE_ENV=production`, um token igual ao do exemplo ou com menos de 24 caracteres impede o boot.
5. O servidor guarda só o **hash** dos tokens ([ADR 0005](0005-autenticacao.md)). Tokens nunca vão para código, `db.json`, log ou resposta.
6. Carrego o ambiente com `node --env-file=.env`, sem a dependência `dotenv`.

### Front-end

No Vite, toda variável `VITE_*` vai para o JavaScript e é pública. Por isso o front nunca recebe segredo: o token é digitado no login. A única exceção são os tokens fictícios do modo mock (`VITE_MOCK_TOKENS`), só para desenvolvimento. O teste SEG-14 confere que o build de produção não contém tokens.

## Variáveis da API

Contrato completo em [`apps/api/.env.example`](../../../apps/api/.env.example).

| Variável | Para quê |
| --- | --- |
| `NODE_ENV`, `PORT` | Ambiente e porta |
| `COWORKING_TIMEZONE` | Fuso ([ADR 0006](0006-tempo-e-fuso.md)) |
| `CORS_ORIGINS` | Origens permitidas |
| `DB_PATH` | Arquivo de dados ([ADR 0003](0003-persistencia.md)) |
| `COMPANY_<ID>_TOKEN` | Token de cada empresa |
| `RATE_LIMIT_*`, `AUTH_FAIL_*`, `AUTH_BLOCK_SECONDS` | Limite de requisições ([ADR 0012](0012-limite-de-requisicoes.md)) |

## Consequências

| Ganho | Custo |
| --- | --- |
| Nenhum segredo no repositório nem no histórico | Um passo a mais para rodar (`npm run setup`) |
| Trocar token é mudar o ambiente | Manter o `.env.example` em dia: um teste falha se uma variável lida não estiver nele |
| Falha rápida e clara | Validação de ambiente é mais código no começo |

## Verificações

Toda variável lida existe no `.env.example` (unitário); ambiente incompleto não sobe e não mostra valores (unitário); produção com valores de exemplo não sobe (unitário); `.env` não versionado (conferido no `git status`); sem token no bundle (SEG-14).

## Fora do escopo

Cofre de segredos (Vault, AWS Secrets Manager) e rotação automática. Em ambiente real as variáveis viriam do cofre da plataforma e o código não muda.
