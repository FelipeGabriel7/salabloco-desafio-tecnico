# ADR 0003. Persistência em arquivo JSON, com seed e repositories

> **Atualização:** esta decisão descreve a solução local inicial. O armazenamento atual também pode usar Redis, conforme [ADR 0016](0016-redis-na-hospedagem.md). A escolha ocorre pela abstração `Storage`; não existem três interfaces de repository no código.

## Decisão

No ambiente local, os dados ficam em **um único arquivo JSON**. O repository em `apps/api/src/infrastructure/persistence/json/` usa uma abstração de armazenamento, com implementações em arquivo e Redis.

Escolhi o arquivo porque o desafio não exige banco e, em disco persistente local, os dados sobrevivem ao reinício. O service importa funções do repository; a troca entre arquivo e Redis ocorre abaixo dele, na camada `Storage`.

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
- O arquivo apontado por `DB_PATH` deve ficar fora do git e nasce na primeira execução. O caminho `apps/api/src/infrastructure/db/db.json` já está rastreado: não inclua dados pessoais ou reservas reais nele.
- O caminho vem de `DB_PATH`, então cada execução de teste usa um arquivo temporário próprio, já semeado.

### Tokens não ficam no arquivo

A empresa no JSON tem só `id` e `name`. O token vem do ambiente (`COMPANY_<ID>_TOKEN`), e o servidor o associa à empresa pelo `id` ([ADR 0005](0005-autenticacao.md), [ADR 0013](0013-configuracao-e-segredos.md)).

## Consequências

**Ganho**
- Em disco local persistente, os dados sobrevivem ao reinício.
- Mudar uma sala é mudar o seed, não a lógica.
- Arquivo e Redis compartilham o mesmo repository e a interface `Storage`.

**Custo e como trato**
- **Escritas simultâneas corrompem o arquivo.** Uso uma fila de escrita ([ADR 0007](0007-concorrencia.md)).
- **Queda no meio de uma gravação.** Gravo num arquivo temporário e renomeio, então o arquivo anterior continua íntegro.
- **Dado pessoal em disco.** O arquivo guarda e-mails de responsáveis; mantenha o `DB_PATH` ativo fora do git e trate-o como sensível ([segurança](../../qualidade/seguranca.md)).
- **Escala.** O arquivo é lido inteiro e reescrito a cada mudança. Neste volume não pesa, e registro como limite conhecido.

## Alternativas descartadas

- **Memória:** é mais simples, mas os dados somem ao reiniciar e a fila de escrita não seria exercitada.
- **Firestore com Emulator:** exige Java e Firebase CLI. Fica como caminho de migração, não como ponto de partida.
- **Banco relacional:** fora do escopo do enunciado.

## Migração futura

Migrar para um banco transacional exige implementação e testes específicos. Não há `PersistenceDriver` nem repositories SQL/Firestore implementados; não é possível garantir que a mudança afetaria apenas um arquivo.
