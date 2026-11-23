# ADR 0011. Estratégia de testes

## Decisão

Sigo a **pirâmide de testes** e testo cada regra **no nível mais baixo em que dá para prová-la**. "29 minutos é recusado" é teste de API; a mensagem aparecer no campo certo é teste de interface.

| Camada | Ferramenta | O que prova |
| --- | --- | --- |
| Unidade | Vitest | Fuso, expediente, sobreposição, esquemas do formulário |
| API | Vitest + Supertest | Rotas, regras com as duas bordas, isolamento entre empresas, concorrência |
| Contrato | Zod nos testes da API e Bruno | Verificam os formatos e cenários cobertos; não validam automaticamente todo o OpenAPI |
| Interface | Playwright | Fluxos críticos, usabilidade, isolamento visto na tela |
| Acessibilidade | axe-core | Procura violações automatizáveis nas telas cobertas; não substitui revisão manual |
| Performance | Artillery | Mede tempos de resposta e verifica os limites configurados; não prova sozinho que apenas uma reserva foi criada |
| Segurança | gitleaks, `npm audit`, CodeQL | Procura padrões de segredos, vulnerabilidades conhecidas e problemas estáticos, sem garantir ausência de falhas |
| Relatório | Allure | Um relatório só, com screenshot de cada teste de interface e vídeo e trace das falhas |

### Como escrevo os testes de interface

- **BDD:** cada teste é um cenário com passos **Dado / Quando / Então** (`test.step`), que aparecem no relatório.
- **Page Objects:** as páginas em `tests/pages` concentram parte das interações; alguns specs também usam seletores diretamente.
- **Seletores:** priorizo papel e rótulo acessível (`getByRole`, `getByLabel`).
- **Fallback:** alguns seletores usam alternativas; isso não garante recuperação automática para toda mudança de interface.
- **Isolamento:** banco temporário, dados criados e apagados pela API e um worker reduzem interferência. Playwright permite retries; uma execução verde não garante ausência de flakiness.

### Supertest em vez de Playwright para a API

Supertest chama o `app` do Express direto, sem abrir porta, e deixa fixar o relógio. Fica rápido o bastante para cobrir todas as bordas. Playwright fica só para o que precisa de navegador.

## Consequências

- **Ganho:** a maioria dos testes roda em segundos, e o navegador cobre só os fluxos que o usuário vê.
- **Custo:** os testes da API configuram o ambiente antes de importar o `app`, porque `config.ts` lê o ambiente na importação.
- **Defeito conhecido em teste:** quando há um defeito conhecido, o cenário fica marcado como falha esperada (`test.fail`) até a correção, e então volta a ser um teste normal. Foi o caso da mensagem do 403 no login.

## Alternativas descartadas

- **Playwright `request` para a API:** mais lento e sem controle do relógio.
- **Cucumber com arquivos `.feature`:** mais uma camada de configuração; os passos em `test.step` dão a mesma leitura.
- **Stryker (mutação):** fica para depois do prazo.
