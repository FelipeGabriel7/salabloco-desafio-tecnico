# Segurança

Cada ameaça tem um controle e um teste que o prova. O ponto central é o **isolamento entre empresas**.

## O que se protege

| Ativo | Por quê |
| --- | --- |
| Reservas de uma empresa (título, e-mail do responsável) | Dado de negócio e pessoal. Só a própria empresa vê |
| Token da empresa | É a credencial |
| Integridade da agenda | Ninguém cria ou apaga reserva em nome de outra empresa |

Tudo que vem do navegador é **não confiável**: corpo, query, parâmetros e headers. O front valida só por usabilidade.

## Ameaças e controles

| ID | Ameaça | Controle | Teste |
| --- | --- | --- | --- |
| A-01 | Acessar reservas de outra empresa trocando o `:companyId` | `:companyId` conferido contra a empresa do token: 403 | SEG-01 |
| A-02 | Apagar reserva de outra empresa (BOLA) | Busca por `id` **e** `companyId`. Não achou: 404, igual a inexistente | SEG-02 |
| A-03 | Descobrir que um id existe | 404 nos dois casos. Ids são UUID | SEG-02 |
| A-04 | Reservar em nome de outra empresa | `companyId` no corpo é recusado (`strict`). A empresa vem do token | SEG-03 |
| A-05 | Vazar dados de terceiros na disponibilidade | Resposta só com `startsAt` e `endsAt`, e só para quem tem token | SEG-04 |
| A-05b | Ver salas e ocupação sem credencial | `/rooms` e disponibilidade exigem token de qualquer empresa | SEG-18 |
| A-06 | Descobrir token por tentativa e erro | Limite de requisições e bloqueio escalonado ([ADR 0012](../arquitetura/adr/0012-limite-de-requisicoes.md)) | SEG-05 |
| A-07 | Vazar o token pelo tempo de resposta | Hash SHA-256 e `timingSafeEqual` | SEG-06 |
| A-08 | Token em log ou erro | Logger oculta `Authorization` | SEG-07 |
| A-09 | Vazar detalhes internos | 500 genérico, sem stack trace | SEG-08 |
| A-10 | Esgotar recursos | Limite de corpo (10 kb), tamanho dos campos, limite de requisições | SEG-09 |
| A-11 | Injeção por entrada | Validação zod. React escapa por padrão; sem `dangerouslySetInnerHTML` | SEG-10 |
| A-12 | Origem não autorizada chamando a API | CORS com lista de origens | SEG-11 |
| A-13 | Clickjacking, sniffing de tipo | `helmet` e CSP | SEG-12 |
| A-14 | Roubo do token no navegador | `sessionStorage`, CSP, sem HTML dinâmico | SEG-13 |
| A-15 | Tokens no bundle do front | O front não carrega tokens: a pessoa digita ([ADR 0005](../arquitetura/adr/0005-autenticacao.md)) | SEG-14 |
| A-16 | Dependência vulnerável | `npm audit`, `npm ci` com lockfile, poucas dependências | `npm audit` |
| A-17 | Segredo no repositório | Tudo vem do ambiente. `.env` fora do git ([ADR 0013](../arquitetura/adr/0013-configuracao-e-segredos.md)) | SEG-17 |
| A-19 | Corrida na criação | Fila de escrita com a checagem dentro ([ADR 0007](../arquitetura/adr/0007-concorrencia.md)) | CA-22 |
| A-20 | Dados pessoais lidos do disco | `db.json` fora do git. Tokens nunca gravados | SEG-16 |
| A-21 | Token em trânsito | HTTPS em qualquer ambiente publicado | doc |
| A-22 | Data ambígua no fuso errado | ISO com fuso explícito, ambíguo recusado | TZ-05 |

## OWASP API Security Top 10 (2023)

| Risco | Tratamento |
| --- | --- |
| API1 Autorização por objeto | A-01 a A-03. Toda consulta filtra por `companyId` |
| API2 Autenticação | A-06, A-07 |
| API3 Autorização por propriedade | A-04, A-05 |
| API4 Consumo de recursos | A-10 |
| API5 Autorização por função | Não há funções administrativas |
| API6 Fluxos de negócio sensíveis | Sem limite de reservas por empresa (fora do enunciado) |
| API7 SSRF | Não há chamadas a URLs informadas pelo usuário |
| API8 Configuração insegura | A-09, A-12, A-13 |
| API9 Inventário | O OpenAPI é o inventário. Sem rotas escondidas nem endpoint de reset |
| API10 Consumo de APIs | Não consome APIs de terceiros |

## Decisões

1. Autentico **antes** de validar.
2. A empresa vem do token, não do corpo.
3. Respondo 404, e não 403, para recurso alheio.
4. Não crio endpoint de teste (`/reset`, `/seed`) em nenhum ambiente. O seed é um script, não uma rota.
5. Cada resposta devolve o mínimo de dados.
6. Mantenho segredos fora do código. Em produção o servidor não sobe com os valores de exemplo.

## Casos de teste

| ID | Cenário | Esperado |
| --- | --- | --- |
| SEG-01 | Token da Acme em `/companies/lumen/bookings` (GET, POST, DELETE) | 403 |
| SEG-02 | Acme apaga reserva da Lumen, e um id que não existe | 404, corpo idêntico |
| SEG-03 | POST com `companyId` ou `id` no corpo | 400 `VALIDATION` |
| SEG-04 | Disponibilidade com reservas de várias empresas | Só `startsAt` e `endsAt` |
| SEG-18 | `GET /rooms` e disponibilidade sem token | 401 |
| SEG-05 | Muitas requisições com token errado | 429 com `Retry-After`. Reincidência bloqueia mais. Outro IP não é afetado |
| SEG-06 | Token certo e errado do mesmo tamanho | Mesma resposta de erro |
| SEG-07 | Requisição com `Authorization` | O log não contém o token |
| SEG-08 | Forçar erro interno | 500 sem stack trace nem caminho de arquivo |
| SEG-09 | Corpo acima do limite, `title` com 10 mil caracteres | 413 ou 400 |
| SEG-10 | Título com `<script>` | Volta igual na lista e nada executa na tela |
| SEG-11 | `Origin` não permitida | Sem `Access-Control-Allow-Origin` |
| SEG-12 | Cabeçalhos da resposta | `X-Content-Type-Options` e `X-Frame-Options` presentes |
| SEG-13 | O front não grava o token em `localStorage` | E2E inspeciona o armazenamento |
| SEG-14 | Bundle de produção | Sem tokens de demonstração (`grep` no `dist`) |
| SEG-16 | `db.json` | Fora do git, sem token dentro |
| SEG-17 | Configuração | Nenhum `.env` versionado. Ambiente incompleto: não sobe. Produção com valores de exemplo: não sobe |

## Fora do escopo

- Rotação e revogação de token, múltiplos usuários, senhas, OAuth: o enunciado fixa o token por empresa.
- HTTPS: de quem publica. Em desenvolvimento é HTTP.
- Trilha de auditoria e monitoramento.
