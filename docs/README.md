# Documentação do Salabloco

```
docs/
├─ produto/        o que o sistema faz
├─ arquitetura/    como é construído e por quê (inclui os ADRs)
├─ api/            contrato da API
├─ qualidade/      testes e segurança
├─ design/         cores, tipografia e formas
└─ ai/             uso de IA no projeto
```

## Produto

| Documento | Conteúdo |
| --- | --- |
| [Visão geral](produto/visao-geral.md) | O projeto, critérios de avaliação, escopo, glossário |
| [Requisitos](produto/requisitos.md) | O desafio item a item, regras de negócio, requisitos funcionais e não funcionais |
| [Backlog](produto/backlog.md) | Tarefas, prioridades e cronograma |

## Arquitetura

| Documento | Conteúdo |
| --- | --- |
| [Arquitetura](arquitetura/arquitetura.md) | Express com MVC e serviços, camadas, fluxo de uma requisição |

### Decisões de arquitetura (ADRs)

| ADR | Assunto |
| --- | --- |
| [0001](arquitetura/adr/0001-express.md) | Express 5 como framework do back-end |
| [0002](arquitetura/adr/0002-estrutura-mvc-servico.md) | MVC com service e repository, monólito modular |
| [0003](arquitetura/adr/0003-persistencia.md) | Persistência em arquivo JSON atrás de um repository |
| [0004](arquitetura/adr/0004-validacao.md) | Validação com zod em middleware e erros por enum |
| [0005](arquitetura/adr/0005-autenticacao.md) | Autenticação e autorização por token de empresa |
| [0006](arquitetura/adr/0006-tempo-e-fuso.md) | Tempo, fuso horário e expediente (07h às 22h) |
| [0007](arquitetura/adr/0007-concorrencia.md) | Concorrência na criação de reservas, com fila de escrita |
| [0008](arquitetura/adr/0008-contrato-de-erros.md) | Contrato de erros e códigos HTTP |
| [0009](arquitetura/adr/0009-monorepo.md) | Um repositório, uma pasta por domínio |
| [0010](arquitetura/adr/0010-frontend.md) | Front-end |
| [0011](arquitetura/adr/0011-estrategia-de-testes.md) | Estratégia de testes |
| [0012](arquitetura/adr/0012-limite-de-requisicoes.md) | Limite de requisições (429) |
| [0013](arquitetura/adr/0013-configuracao-e-segredos.md) | Configuração e segredos: `.env` e `.env.example` |
| [0014](arquitetura/adr/0014-enums-e-interfaces.md) | Enums e interfaces como contrato de tipos |

## API

| Documento | Conteúdo |
| --- | --- |
| [API](api/api.md) | Rotas, erros e a ordem das verificações |
| [OpenAPI](api/openapi.yaml) | Contrato formal |

## Qualidade

| Documento | Conteúdo |
| --- | --- |
| [Estratégia de QA](qualidade/qa.md) | Casos de aceite, Playwright, portões de qualidade |
| [Segurança](qualidade/seguranca.md) | Modelo de ameaças, OWASP API Top 10, casos de teste |

## Design e IA

| Documento | Conteúdo |
| --- | --- |
| [Design](design/README.md) | Cores, tipografia e formas |
| [Uso de IA](ai/uso-de-ia.md) | Onde a IA foi usada e onde não foi |

## Convenções

- Idioma: português nos documentos e na interface. Código e nomes em inglês.
- Cada ADR registra uma decisão minha, com consequências e alternativas.
- Os IDs (RF, RN, RNF, CA, SEG, UI, S, W, Q, C, D) são estáveis. Commits, testes e PRs os citam.
