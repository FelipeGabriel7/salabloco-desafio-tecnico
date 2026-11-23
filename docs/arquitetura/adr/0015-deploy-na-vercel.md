# ADR 0015. Deploy na Vercel, pelo pipeline

## Decisão

Publico **API e front como dois projetos na Vercel**, e quem publica é o **pipeline do GitHub Actions**, só na `main` e só depois de todas as etapas passarem.

- **Front:** build estático do Vite. O `vercel.json` encaminha `/api/*` para a API, então o navegador fala com um domínio só e não preciso de CORS.
- **API:** o `app` do Express exportado como função serverless (`apps/api/api/index.ts`), com o seed rodando na inicialização.
- **Segredos:** os tokens das empresas ficam nas variáveis de ambiente da Vercel; o token de deploy fica nos secrets do GitHub.
- **Deploy pelo Git da Vercel desligado** (`git.deploymentEnabled: false`), para nada ir ao ar sem passar pelos testes.

## Consequências

- **Ganho:** link público para demonstração, deploy repetível e bloqueado por testes.
- **Limite:** a função serverless só pode gravar em `/tmp`, que é temporário. As reservas se perdem quando a função é reciclada, e instâncias diferentes não compartilham a fila de escrita ([ADR 0007](0007-concorrencia.md)).
- **Saída:** trocar o repository JSON por um banco gerenciado, sem mexer em services e controllers ([ADR 0003](0003-persistencia.md)).

## Alternativas descartadas

- **Deploy automático pelo Git da Vercel:** publicaria antes dos testes terminarem.
- **Render ou Railway para a API:** teriam disco persistente, mas seriam um segundo provedor para configurar.
- **Front chamando a API direto:** exigiria CORS e expor a URL da API no bundle.
