# ADR 0005. Autenticação e autorização por token de empresa

## Contexto

Cada empresa tem um token próprio e fixo, enviado em um header. Não há usuário nem senha: o token é a credencial. O maior risco do produto é uma empresa acessar dados de outra, e é nisso que concentro a segurança.

## Decisão

**Back-end**
- Uso o header `Authorization: Bearer <token>`. Ausente, desconhecido ou inválido: **401**.
- A empresa vem **sempre do token**. O `:companyId` da URL (exigido pelas rotas do enunciado) só é conferido: divergência gera **403**. Não aceito `companyId` no corpo (esquema `strict`).
- `DELETE` de reserva de outra empresa ou inexistente devolve **404**, para não revelar que o id existe (defesa contra BOLA).
- Guardo o **hash SHA-256** dos tokens e comparo com `crypto.timingSafeEqual`. Os tokens vêm de variáveis de ambiente ([ADR 0013](0013-configuracao-e-segredos.md)), nunca do código nem do arquivo de dados, e nunca entram em log ou resposta.
- **Nenhuma rota é pública.** `GET /rooms` e `GET /rooms/:id/availability` aceitam o token de qualquer empresa (sem checar `:companyId`), e a disponibilidade só expõe `startsAt` e `endsAt`. Sem token, 401: ninguém sem credencial enxerga salas nem ocupação.
- Não crio rota de login. O front valida o token chamando `GET /companies/:companyId/bookings`.

**Front-end**
- A pessoa **digita** o token. Os tokens não estão no bundle.
- O token fica em `sessionStorage` (some ao fechar a aba), vai no header e é removido ao sair ou ao receber 401.

## Consequências

| Ganho | Custo |
| --- | --- |
| Isolamento entre empresas decidido no servidor | Tokens fixos: sem rotação nem revogação |
| 404 impede enumeração de ids | O login do front depende de uma rota de reservas |
| Superfície mínima: nada é visível sem token | HTTP em desenvolvimento local; HTTPS obrigatório em ambiente publicado |

O teste SEG-14 confere que o bundle de produção não contém tokens.

## Alternativas

| Opção | Por que não escolhi |
| --- | --- |
| Rotas de salas públicas | Expõem catálogo e ocupação a quem não tem credencial; contraria o princípio de mínima exposição |
| Tokens embutidos no front | Qualquer pessoa leria os tokens de todas as empresas |
| `POST /auth/login` | Endpoint fora do enunciado, sem ganho de segurança |
| 403 para reserva alheia | Confirma que o id existe |
