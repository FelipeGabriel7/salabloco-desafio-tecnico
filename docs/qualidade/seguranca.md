# Segurança

> **Estado atual:** esta matriz inclui ameaças e controles planejados. Helmet/CSP, logger com redação e rejeição de tokens fracos em produção não estão implementados. Os cenários correspondentes são pendências, não garantias já implementadas.

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
| A-02 | Apagar/editar reserva de outra empresa (BOLA) | Busca por `id` **e** `companyId`. Não achou: 404, igual a inexistente | SEG-02, SEG-22 |
| A-03 | Descobrir que um id existe | 404 nos dois casos. Ids são UUID | SEG-02 |
| A-04 | Reservar em nome de outra empresa | `companyId` no corpo é recusado (`strict`). A empresa vem do token | SEG-03 |
| A-05 | Vazar dados de terceiros na disponibilidade | Resposta só com `startsAt` e `endsAt`, e só para quem tem token | SEG-04 |
| A-05b | Consultar catálogos sem credencial | Empresas e salas públicas contêm apenas id/nome/capacidade | SEG-18, SEG-21 |
| A-05c | Obter configuração sem token | `/api/config` exige token e devolve apenas timezone | SEG-20 |
| A-06 | Descobrir token por tentativa e erro | Limite de requisições, bloqueio escalonado ([ADR 0012](../arquitetura/adr/0012-limite-de-requisicoes.md)) e comparação de token em tempo constante (`timingSafeEqual` sobre SHA-256) | SEG-05 |
| A-07 | Vazar o token pelo tempo de resposta | Trade-off conhecido: comparação simples no desafio; produto real deve usar comparação em tempo constante | SEG-06 |
| A-08 | Token em log ou erro | Não há logger de requisição dedicado com redação; evitar registrar tokens | SEG-07 planejado |
| A-09 | Vazar detalhes internos | 500 genérico, sem stack trace | SEG-08 |
| A-10 | Esgotar recursos | Limite de corpo de 16 KB, tamanho dos campos e limite de requisições por IP | SEG-09 |
| A-11 | Injeção por entrada | Validação zod. React escapa por padrão; sem `dangerouslySetInnerHTML` | SEG-10 |
| A-12 | Chamadas do front para a API no desenvolvimento | Proxy do Vite em `/api`; em produção, servir front e API na mesma origem | SEG-11 |
| A-13 | Clickjacking, sniffing de tipo | `helmet` e CSP não configurados na API; avaliar na hospedagem | SEG-12 planejado |
| A-14 | Roubo do token no navegador | Token mantido só em memória React; não é salvo no storage do navegador | SEG-13 |
| A-15 | Tokens no bundle do front | O front não carrega tokens: a pessoa digita ([ADR 0005](../arquitetura/adr/0005-autenticacao.md)) | SEG-14 |
| A-16 | Dependência vulnerável | `npm audit`, `npm ci` com lockfile, poucas dependências | `npm audit` |
| A-17 | Segredo no repositório | Tudo vem do ambiente. `.env` fora do git ([ADR 0013](../arquitetura/adr/0013-configuracao-e-segredos.md)) | SEG-17 |
| A-19 | Corrida na criação | Fila de escrita com a checagem dentro ([ADR 0007](../arquitetura/adr/0007-concorrencia.md)) | CA-22 |
| A-20 | Dados pessoais lidos do disco | O `DB_PATH` ativo deve ficar fora do git; há um `db.json` histórico rastreado. Tokens não são gravados pelo repository | SEG-16 |
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
6. Credenciais reais devem ficar fora do código. A API atual exige tokens presentes, mas não bloqueia automaticamente valores de exemplo em produção.

## Casos de teste

| ID | Cenário | Esperado |
| --- | --- | --- |
| SEG-01 | Token da Acme em `/api/companies/lumen/bookings` (GET, POST, DELETE) | 403 |
| SEG-02 | Acme apaga reserva da Lumen, e um id que não existe | 404, corpo idêntico |
| SEG-03 | POST com `companyId` ou `id` no corpo | 400 `VALIDATION` |
| SEG-04 | Disponibilidade com reservas de várias empresas | Só `startsAt` e `endsAt` |
| SEG-18 | `GET /api/rooms` sem token | 200 com o catálogo |
| SEG-19 | Disponibilidade sem token | 401 |
| SEG-20 | `GET /api/config` sem token | 401 |
| SEG-21 | `GET /api/companies` sem token | 200 só com id/nome |
| SEG-22 | Acme edita id de reserva da Lumen pelo path Acme | 404, sem alterar a reserva Lumen |
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
| SEG-16 | `db.json` | O arquivo ativo deve estar fora do git e sem tokens; conferir o arquivo histórico rastreado |
| SEG-17 | Configuração | Tokens ausentes impedem boot. Bloqueio de valores de exemplo em produção é pendência |

## Fora do escopo

- Rotação e revogação de token, múltiplos usuários, senhas, OAuth: o enunciado fixa o token por empresa.
- HTTPS: de quem publica. Em desenvolvimento é HTTP.
- Trilha de auditoria e monitoramento.
