# ADR 0005. Autenticação e autorização por token de empresa

## Decisão

### Back-end

- Autentico com `Authorization: Bearer <token>`. Token ausente, desconhecido ou inválido devolve **401**.
- A empresa vem **sempre do token**. O `:companyId` da URL só é conferido: se divergir do token, **403**. Não aceito `companyId` no corpo (esquema `strict`).
- `DELETE` de reserva de outra empresa, ou inexistente, devolve **404**. Assim não revelo que o id existe (defesa contra BOLA).
- Leio os tokens das variáveis de ambiente ([ADR 0013](0013-configuracao-e-segredos.md)) e comparo com o token recebido. Não os coloco no código, arquivo de dados, log ou resposta.
- `GET /api/health`, `GET /api/companies` e `GET /api/rooms` são públicos; eles só devolvem estado básico/catálogos.
- `GET /api/config` exige token e devolve somente o fuso do coworking.
- `GET /api/rooms/:id/availability` aceita o token de qualquer empresa e expõe só `startsAt` e `endsAt`. Sem token, 401.
- Não crio rota de login. O front valida o token chamando `GET /api/companies/:companyId/bookings` e depois lê o fuso com `GET /api/config`.

### Front-end

- A pessoa escolhe uma empresa carregada pela API e **digita** o token, que não está no bundle.
- O token fica apenas no estado React em memória, vai no header e é removido ao sair ou recarregar a página. Assim, a aplicação não reutiliza sessão após trocar o `.env` do servidor.

## Consequências

- **Ganho:** o isolamento entre empresas é decidido no servidor, o 404 impede a enumeração de reservas e o token não fica persistido no navegador.
- **Custo:** os catálogos (empresas/salas) são públicos; os tokens são fixos, sem rotação nem revogação, ficam em memória e a comparação não é constante no tempo. Essa simplificação é suficiente para o desafio; um produto real deve guardar hashes e comparar em tempo constante. Em ambiente publicado, HTTPS é obrigatório.
- **Verificação:** o teste SEG-14 confere que o bundle de produção não contém tokens.

## Alternativas descartadas

- **Disponibilidade pública:** exporia horários ocupados sem credencial.
- **Tokens embutidos no front:** qualquer pessoa leria os tokens de todas as empresas.
- **`POST /auth/login`:** endpoint fora do enunciado e sem ganho de segurança.
- **403 para reserva de outra empresa:** confirmaria que o id existe.
