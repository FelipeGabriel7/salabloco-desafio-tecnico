# ADR 0011. Estratégia de testes

## Decisão

Sigo a **pirâmide de testes** e testo cada regra **no nível mais baixo em que dá para prová-la**. "29 minutos é recusado" é teste de API; a mensagem aparecer no campo certo é teste de interface.

| Camada | Ferramenta | O que prova |
| --- | --- | --- |
| Unidade | Vitest | Fuso, expediente, sobreposição, esquemas do formulário |
| API | Vitest + Supertest | Rotas, regras com as duas bordas, isolamento entre empresas, concorrência |
| Contrato | zod nos testes da API e Bruno | Cada resposta tem exatamente o formato combinado |
| Interface | Playwright | Fluxos críticos, usabilidade, isolamento visto na tela |
| Acessibilidade | axe-core | Nenhuma violação grave nas telas principais |
| Performance | Artillery | p95 e p99 sob carga, e um único 201 quando muitos disputam o mesmo horário |
| Segurança | gitleaks, `npm audit`, CodeQL | Segredos, dependências vulneráveis e falhas no código |
| Relatório | Allure | Um relatório só, com screenshot de cada teste de interface e vídeo e trace das falhas |

### Como escrevo os testes de interface

- **BDD:** cada teste é um cenário com passos **Dado / Quando / Então** (`test.step`), que aparecem no relatório.
- **Page Objects:** os specs só falam com páginas (`tests/pages`). Nenhum seletor fica no spec.
- **Seletores estáveis:** por papel e rótulo acessível (`getByRole`, `getByLabel`), nunca por classe CSS.
- **Auto-healing:** cada elemento tem um seletor alternativo (`locator.or`), usado se o principal deixar de existir.
- **Sem flaky:** banco temporário, dados criados e apagados pela API em cada teste, datas relativas, nenhum `sleep` e um worker só.

### Supertest em vez de Playwright para a API

Supertest chama o `app` do Express direto, sem abrir porta, e deixa fixar o relógio. Fica rápido o bastante para cobrir todas as bordas. Playwright fica só para o que precisa de navegador.

## Consequências

- **Ganho:** a maioria dos testes roda em segundos, e o navegador cobre só os fluxos que o usuário vê.
- **Custo:** os testes da API configuram o ambiente antes de importar o `app`, porque `config.ts` lê o ambiente na importação.
- **Defeito conhecido em teste:** um cenário marcado como falha esperada (`test.fail`) avisa quando o defeito for corrigido.

## Alternativas descartadas

- **Playwright `request` para a API:** mais lento e sem controle do relógio.
- **Cucumber com arquivos `.feature`:** mais uma camada de configuração; os passos em `test.step` dão a mesma leitura.
- **Stryker (mutação):** fica para depois do prazo.
