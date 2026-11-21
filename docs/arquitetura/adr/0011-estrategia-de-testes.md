# ADR 0011. Estratégia de testes

Plano de execução em [qa.md](../../qualidade/qa.md).

## Contexto

O critério pede testes que cubram as regras importantes, não só o caminho feliz. O mínimo são 3 testes; como a qualidade é meu diferencial, planejo bem mais.

## Decisão

| Camada | Ferramenta | O que prova |
| --- | --- | --- |
| Unitário | Vitest | Regras e bordas dos services e utilitários, sem rede |
| API | Playwright (`request`) | Rotas, autenticação, validação, erros, concorrência, privacidade, contra o servidor real |
| Interface | Playwright | Só os fluxos críticos |
| Acessibilidade | axe-core | Violações nas telas principais |
| Contrato | Bruno CLI | A API responde como o OpenAPI descreve |
| Segurança | Testes SEG-xx e `npm audit` | Controles do [modelo de ameaças](../../qualidade/seguranca.md) |
| Performance | Artillery | Carga e limite de requisições |
| Mutação | Stryker nos services | Os testes falham de verdade quando a regra quebra |
| Relatório | Allure, trace e screenshot | Resultado legível e diagnóstico de falhas |

Testo cada regra **no nível mais baixo em que dá para provar**: "29 minutos é recusado" é unitário; o 422 na rota é de API; a mensagem no campo certo é E2E.

## Playwright para a API (em vez de supertest)

| | Playwright API | supertest |
| --- | --- | --- |
| Execução | Servidor real, por HTTP | Dentro do processo |
| Ferramenta | A mesma da interface, mesmo relatório | Outra ferramenta |
| Velocidade | Mais lenta | Mais rápida |
| Isolamento | Estado compartilhado: exige cuidado | App novo por teste |

Escolhi Playwright pela fidelidade (testo o pacote como ele roda) e por usar uma ferramenta só. Para isolar o estado: arquivo de dados temporário (`DB_PATH`) por execução; cada teste usa sala e horário próprios e limpa o que criou pela API pública; **sem endpoint de reset**; testes de concorrência e de limite rodam isolados.

## Riscos e tratamento

| Risco | Tratamento |
| --- | --- |
| O limite de requisições (429) bloqueia os próprios testes | Limites configuráveis: altos nos testes normais, baixos e isolados nos testes do 429 ([ADR 0012](0012-limite-de-requisicoes.md)) |
| Teste de carga é lento e instável | Rodo o Artillery separado dos testes normais |
| Escopo maior que o do enunciado | O [backlog](../../produto/backlog.md) define prioridades. Não corto: testes de regra, de acesso entre empresas e README |

## Princípios

1. Determinismo: relógio injetado, sem `sleep`.
2. Nomes descrevem comportamento.
3. Cada caso de aceite (CA-xx) aponta para o teste que o prova.
4. Testo o que dá errado antes do que dá certo: cada regra tem a borda dos dois lados.
