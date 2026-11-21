# ADR 0003. Persistência em arquivo JSON, com seed e repositories

## Decisão

O banco de dados é **um único arquivo JSON** (`db.json`), e o código só o acessa por interfaces de repository: `CompanyRepository`, `RoomRepository` e `BookingRepository`. A implementação fica em `apps/api/src/infrastructure/persistence/json/`.

Escolhi o arquivo porque o desafio não pede banco, mas os dados precisam sobreviver a um reinício. A interface de repository mantém essa escolha trocável: nenhuma regra de negócio sabe que existe um arquivo.

```json
{
  "companies": [{ "id": "acme", "name": "Acme Tecnologia" }],
  "rooms": [{ "id": "savassi", "name": "Sala Savassi", "capacity": 6 }],
  "bookings": []
}
```

### Seed de empresas e salas

Quem insere empresas e salas no arquivo é o **back-end**. O front não conhece esses dados e os lê pela API.

- A fonte é `apps/api/src/infrastructure/db/seed.ts`, versionado. Ele roda na subida do servidor e por `npm run seed -w apps/api`.
- É **idempotente**: insere só o que falta, comparando por `id`, e nunca apaga nem altera reservas.
- Versiono o seed, não os dados: o `db.json` fica **fora do git** e nasce na primeira execução.
- O caminho vem de `DB_PATH`, então cada execução de teste usa um arquivo temporário próprio, já semeado.

### Tokens não ficam no arquivo

A empresa no JSON tem só `id` e `name`. O token vem do ambiente (`COMPANY_<ID>_TOKEN`), e o servidor o associa à empresa pelo `id` ([ADR 0005](0005-autenticacao.md), [ADR 0013](0013-configuracao-e-segredos.md)).

## Consequências

**Ganho**
- Os dados sobrevivem ao reinício.
- Mudar uma sala é mudar o seed, não a lógica.
- Trocar de banco afeta só a implementação dos repositories.

**Custo e como trato**
- **Escritas simultâneas corrompem o arquivo.** Uso uma fila de escrita ([ADR 0007](0007-concorrencia.md)).
- **Queda no meio de uma gravação.** Gravo num arquivo temporário e renomeio, então o arquivo anterior continua íntegro.
- **Dado pessoal em disco.** O arquivo guarda e-mails de responsáveis, por isso fica fora do git e é tratado como sensível ([segurança](../../qualidade/seguranca.md)).
- **Escala.** O arquivo é lido inteiro e reescrito a cada mudança. Neste volume não pesa, e registro como limite conhecido.

## Alternativas descartadas

- **Memória:** é mais simples, mas os dados somem ao reiniciar e a fila de escrita não seria exercitada.
- **Firestore com Emulator:** exige Java e Firebase CLI. Fica como caminho de migração, não como ponto de partida.
- **Banco relacional:** fora do escopo do enunciado.

## Migração futura

Migrar é escrever outra implementação (`FirestoreBookingRepository`, `SqlBookingRepository`) e escolher qual usar por configuração (`PersistenceDriver`). Services e controllers não mudam, e a atomicidade que hoje vem da fila passaria a vir de uma transação do banco.
