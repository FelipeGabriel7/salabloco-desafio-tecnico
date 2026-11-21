# Testes (Playwright)

```
tests/
├─ api/          testes de API (HTTP real contra o servidor)
├─ e2e/          fluxos críticos na interface, com axe
├─ pages/        Page Objects
├─ fixtures/     configuração, cliente da API, autenticação
├─ performance/  cenários Artillery
└─ contract/     coleção Bruno
```

Estratégia, casos de aceite e portões de qualidade: [docs/qualidade/qa.md](../docs/qualidade/qa.md) e [ADR 0011](../docs/arquitetura/adr/0011-estrategia-de-testes.md).

```bash
npm run setup                  # cria os .env a partir dos exemplos
npx playwright install chromium
npm run test:api               # na raiz
npm run test:e2e
```
