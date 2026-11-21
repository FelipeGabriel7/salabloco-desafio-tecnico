# ADR 0005. Autenticação e autorização por token de empresa

## Decisão

### Back-end

- Autentico com `Authorization: Bearer <token>`. Token ausente, desconhecido ou inválido devolve **401**.
- A empresa vem **sempre do token**. O `:companyId` da URL só é conferido: se divergir do token, **403**. Não aceito `companyId` no corpo (esquema `strict`).
- `DELETE` de reserva de outra empresa, ou inexistente, devolve **404**. Assim não revelo que o id existe (defesa contra BOLA).
- Guardo o **hash SHA-256** dos tokens e comparo com `crypto.timingSafeEqual`. Os tokens vêm de variáveis de ambiente ([ADR 0013](0013-configuracao-e-segredos.md)) e nunca entram em código, arquivo de dados, log ou resposta.
- **Nenhuma rota é pública.** `GET /rooms` e `GET /rooms/:id/availability` aceitam o token de qualquer empresa, e a disponibilidade expõe só `startsAt` e `endsAt`. Sem token, 401.
- Não crio rota de login. O front valida o token chamando `GET /companies/:companyId/bookings`.

### Front-end

- A pessoa **digita** o token, que não está no bundle.
- O token fica em `sessionStorage` (some ao fechar a aba), vai no header e é removido ao sair ou ao receber 401.

## Consequências

- **Ganho:** o isolamento entre empresas é decidido no servidor, o 404 impede a enumeração de ids, e nada é visível sem token.
- **Custo:** os tokens são fixos, sem rotação nem revogação. O login do front depende de uma rota de reservas. Em desenvolvimento uso HTTP; num ambiente publicado, HTTPS é obrigatório.
- **Verificação:** o teste SEG-14 confere que o bundle de produção não contém tokens.

## Alternativas descartadas

- **Rotas de salas públicas:** expõem catálogo e ocupação a quem não tem credencial.
- **Tokens embutidos no front:** qualquer pessoa leria os tokens de todas as empresas.
- **`POST /auth/login`:** endpoint fora do enunciado e sem ganho de segurança.
- **403 para reserva de outra empresa:** confirmaria que o id existe.
