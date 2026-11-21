# ADR 0003. Persistência em arquivo JSON com seed, atrás de um repository

## Contexto

O desafio permite memória ou arquivo JSON. Firestore com Emulator seria um extra. Preciso que os dados sobrevivam a reinícios e de um conjunto de dados controlado para os testes. O enunciado fala em empresas e salas fixas; eu as transformo em dados de seed, para que o arquivo seja o único "banco".

## Decisão

Escolhi **um único arquivo JSON como banco**, acessado só por interfaces de repository (`CompanyRepository`, `RoomRepository`, `BookingRepository`). A implementação fica em `apps/api/src/infrastructure/persistence/json/`.

```json
{
  "companies": [{ "id": "acme", "name": "Acme Tecnologia" }],
  "rooms": [{ "id": "savassi", "name": "Sala Savassi", "capacity": 6 }],
  "bookings": []
}
```

### Seed

- O **back-end** insere empresas e salas no JSON. O front não conhece esses dados: ele os lê pela API.
- A fonte do seed é `apps/api/src/infrastructure/db/seed.ts` (versionado). Ele roda na subida do servidor e também por `npm run seed -w apps/api`.
- O seed é **idempotente**: insere o que falta (por `id`) e **nunca apaga nem altera reservas**.
- O `db.json` fica **fora do git** e é criado na primeira execução. Versiono o seed, não os dados.
- O caminho do arquivo é configurável (`DB_PATH`): cada execução de teste usa um arquivo temporário próprio, já semeado.

### O que nunca vai para o arquivo

**Tokens.** A empresa no JSON só tem `id` e `name`. O token vem do ambiente (`COMPANY_<ID>_TOKEN`) e o servidor o associa à empresa pelo `id` ([ADR 0005](0005-autenticacao.md), [ADR 0013](0013-configuracao-e-segredos.md)).

## Consequências

| Aspecto | Efeito |
| --- | --- |
| Dados sobrevivem ao reinício | Ganho sobre memória |
| Concorrência | Escritas simultâneas em arquivo corrompem dados. Resolvo com fila de escrita ([ADR 0007](0007-concorrencia.md)) |
| Integridade | Escrita atômica: gravo em arquivo temporário e renomeio. Se o processo morrer no meio, o arquivo anterior continua íntegro |
| Dado pessoal em disco | O arquivo contém e-mails de responsáveis: fica fora do git e é tratado como sensível ([seguranca.md](../../qualidade/seguranca.md)) |
| Empresas e salas | Mudar uma sala é mudar o seed, não a lógica. Cadastro por tela continua fora do escopo |
| Escala | O arquivo é lido inteiro e reescrito a cada mudança. Irrelevante neste escopo; registro como limite conhecido |

## Alternativas

| Opção | Por que não escolhi |
| --- | --- |
| Memória | Mais simples, mas os dados somem ao reiniciar e não exercita a fila de escrita |
| Firestore + Emulator | Exige Java e Firebase CLI. Fica como **caminho de migração**, não como ponto de partida |
| Banco relacional | Fora do escopo do enunciado |

## Caminho de migração

Como o acesso é por interface, migrar é escrever outra implementação (`FirestoreBookingRepository`, `SqlBookingRepository`) e escolher qual usar por configuração (`PersistenceDriver`). Services e controllers não mudam. A atomicidade que hoje vem da fila passaria a vir de uma transação do banco.
