# Estratégia de QA

> **Leitura da matriz:** os casos abaixo incluem cenários planejados e objetivos de cobertura, não apenas testes implementados. Stryker, execução semanal de performance e rate limit não estão configurados no pipeline atual; consulte os testes e a execução do CI para verificar cobertura e resultados reais.

Decisão no [ADR 0011](../arquitetura/adr/0011-estrategia-de-testes.md). Aqui: o que testar, em que nível e como cada regra é provada.

## Pirâmide

| Nível | Ferramenta | Roda |
| --- | --- | --- |
| Unitário | Vitest | Todo push |
| API | Supertest contra o app Express | Todo push |
| Contrato | Bruno CLI | Todo push |
| Interface (E2E) | Playwright, só fluxos críticos no navegador | Todo push |
| Acessibilidade | axe-core no Playwright | Todo push |
| Mutação | Stryker nos services | Semanal |
| Performance | Artillery | Fumaça no PR, completo semanal |

Cada regra é testada **no nível mais baixo em que dá para provar**.

## Riscos e onde são cobertos

| Risco | Cobertura |
| --- | --- |
| Reserva sobreposta aceita | Unitário, API, concorrência, Stryker |
| Vazamento entre empresas | API (SEG-xx) e E2E de isolamento |
| Erro de fuso | Unitário de `time`, incluindo 2018 |
| Arquivo corrompido por escrita concorrente | API de concorrência |
| Erro que o usuário não entende | E2E dos fluxos de erro |
| Layout quebrado no celular | E2E móvel e axe |

## Casos de aceite

Nível: **U** unitário, **A** API, **E** interface.

### Reservas

| ID | Cenário | Esperado | Nível |
| --- | --- | --- | --- |
| CA-01 | Reserva válida de 1 hora | 201 | A |
| CA-02 | Exatamente 30 minutos | 201 | U, A |
| CA-03 | 29 minutos | 422 `DURATION_TOO_SHORT` | U, A |
| CA-04 | Exatamente 4 horas | 201 | U |
| CA-05 | 4 horas e 1 minuto | 422 `DURATION_TOO_LONG` | U, A |
| CA-06 | Fim igual ou antes do início | 422 `END_BEFORE_START` | U |
| CA-06b | Início às 06:30 ou fim às 22:30 | 422 `OUTSIDE_OPENING_HOURS` | U, A |
| CA-06c | Reserva começa às 07:00 ou termina às 22:00, com duração válida | 201 | A |
| CA-07 | Início no passado, com relógio fixo | 422 `IN_THE_PAST` | U, A |
| CA-07b | Começar exatamente agora | 201 | U |
| CA-08 | Sobreposição parcial na mesma sala | 409 com `conflict` e `suggestions` | U, A, E |
| CA-09 | Reserva contida em outra, ou que contém outra | 409 | U |
| CA-10 | 10:00–11:00 existe e a nova é 11:00–12:00 | 201 (colada não conflita) | U, A |
| CA-11 | Mesmo horário em outra sala | 201 | U |
| CA-12 | Outra empresa, mesma sala e horário | 409 | A |
| CA-14 | E-mail inválido ou título vazio | 400 com `field` | A, E |
| CA-15 | `date=2026-02-30` | 400 `INVALID_DATE` | U, A |
| CA-15b | `startsAt` sem fuso | 400 | U, A |
| CA-16 | Sala inexistente na disponibilidade | 404 | A |
| CA-22 | N criações simultâneas no mesmo horário | Um 201, os demais 409. Arquivo continua válido | A |
| CA-24 | Erro inesperado | 500 sem stack trace | A |
| CA-25 | Conflito devolve sugestões | Alternativas livres, nunca no passado | U, A |
| CA-26 | Conflito sem alternativa no dia | `suggestions` vazio | U |

### Tempo e fuso

| ID | Cenário | Esperado |
| --- | --- | --- |
| TZ-01 | 21:30 locais | Dia seguinte em UTC, mesmo dia no coworking |
| TZ-02 | Limites do dia em `2026-11-20` | 00:00 e 24:00 de São Paulo |
| TZ-03 | Dia em `2018-11-20` (horário de verão) | Limites com `-02:00`. Prova que não há offset fixo |
| TZ-04 | `COWORKING_TIMEZONE=America/Manaus` | Limites com `-04:00` |
| TZ-05 | `startsAt` sem fuso | 400, sem usar o fuso da máquina |

### Acesso e privacidade

| ID | Cenário | Esperado |
| --- | --- | --- |
| CA-17 | Sem token ou token desconhecido na disponibilidade e nas rotas de reservas | 401 |
| CA-23 | Listar salas sem token | 200 |
| CA-27 | `GET /api/companies` sem token | 200 com empresas do seed |
| CA-28 | `GET /api/config` sem token/com token válido | 401/200 com timezone |
| CA-29 | PUT de reserva própria / id de outra empresa | 200/404; reserva alheia intacta |
| CA-30 | PUT para intervalo já ocupado | 409; reserva original intacta |
| CA-18 | Token da Acme na rota da Lumen | 403 |
| CA-19 | Cancelar reserva própria | 204 |
| CA-20 | Cancelar reserva de outra empresa, ou inexistente | 404, corpo idêntico |
| CA-21 | Disponibilidade com token de qualquer empresa | Só `startsAt` e `endsAt` |
| CA-31 | Lista com várias empresas | Só as da empresa do token |

Segurança: SEG-01 a SEG-17 em [seguranca.md](seguranca.md).

### Interface

| ID | Cenário | Esperado |
| --- | --- | --- |
| UI-01 | Login com token errado | Erro claro |
| UI-02 | Login certo | Abre as reservas da empresa |
| UI-03 | 401 durante o uso | Volta ao login com aviso |
| UI-04 | Lista | Estados carregando, erro e vazio |
| UI-05 | Cancelar | Pede confirmação |
| UI-06 | Formulário vazio | Erro por campo, sem chamar a API |
| UI-07 | Criar com sucesso | Aviso e reserva na lista |
| UI-08 | Conflito (409) | Alerta com foco e sugestões |
| UI-09 | 429 | Mensagem com o tempo de espera |
| UI-10 | Reserva | Campos de início/fim validam expediente e duração |
| UI-11 | Isolamento | Empresa A não vê reserva da B |
| UI-12 | Acessibilidade | Sem violação grave no axe |
| UI-13 | Tema claro e escuro | Persiste e é legível |

### Performance

| ID | Cenário | Critério |
| --- | --- | --- |
| PERF-01 | Leitura de disponibilidade com carga constante | p95 e erro calibrados na primeira medição |
| PERF-02 | Criação em rajada na mesma sala | Um 201 por horário, arquivo íntegro |
| PERF-03 | Pico acima do limite | 429 com `Retry-After` |
| PERF-04 | Recuperação após o bloqueio | Volta ao normal |

## Como cada camada é montada

- **Unitário:** services com repositório em arquivo temporário e relógio fixo. Nomes descrevem comportamento ("recusa reserva com 29 minutos").
- **API:** servidor real com `DB_PATH` temporário. Cada teste usa sala e horário próprios e limpa o que criou pela API pública. Sem endpoint de reset. Concorrência e limite de requisições rodam isolados. Datas sempre relativas.
- **Interface:** Page Objects, seletores por papel e rótulo, sem `waitForTimeout`, login reaproveitado, trace e screenshot das falhas.
- **Contrato:** `bru run` confere status e formato conforme o OpenAPI.
- **Mutação:** Stryker altera regras dos services de propósito e confere se algum teste falha. Meta: 80%.
- **Relatório:** Allure, com traces e screenshots.

```
tests/
├─ api/  e2e/  pages/  fixtures/  performance/
├─ contract/bruno/
└─ playwright.config.ts
```

## Portões de qualidade

| Portão | Critério |
| --- | --- |
| Tipos | Sem erro |
| Unitários, API e E2E | Todos passam, sem depender de repetição |
| Acessibilidade | Sem violação grave |
| Contrato | Coleção Bruno verde |
| Segurança | `npm audit` sem vulnerabilidade alta |
| Bundle | Sem tokens de demonstração (SEG-14) |

## Dados de teste

Tokens de demonstração vêm do ambiente (`.env`), nunca escritos nos testes. Salas vêm do seed. Relógio fixo nos unitários.

## Exploração manual antes de entregar

- [ ] Clonar em pasta nova e seguir o README.
- [ ] Tentar quebrar: datas absurdas, títulos enormes, trocar o id na URL.
- [ ] Abrir no celular e navegar só pelo teclado.
- [ ] Matar o servidor no meio de uma escrita e conferir que o `db.json` continua válido.
