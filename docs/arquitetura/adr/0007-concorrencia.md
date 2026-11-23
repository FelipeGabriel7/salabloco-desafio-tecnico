# ADR 0007. Concorrência na criação de reservas

> **Atualização:** o fluxo atual usa a abstração `Storage`: fila local para arquivo e trava com TTL para Redis. Veja [ADR 0016](0016-redis-na-hospedagem.md) para a limitação da trava distribuída.

## Decisão

Quero evitar duas coisas: a corrida entre checar e gravar (duas requisições leem o mesmo estado antigo e as duas reservam) e a corrupção do arquivo por escritas simultâneas.

Uso **uma fila que executa uma escrita por vez**, com **a leitura, a checagem de conflito e a gravação dentro dela**.

```ts
await queue.run(async () => {
  const conflict = findConflict(state.bookings, nova);          // lê
  if (conflict) throw new AppError(ErrorCode.BOOKING_CONFLICT); // decide
  state.bookings.push(nova);                                    // altera
  await persistAtomically(state);                               // grava (tmp + rename)
});
```

Se a fila serializasse só o ato de gravar, com a checagem fora dela, a corrida continuaria.

- **Leitura:** o arquivo é lido conforme as operações; o `snapshot` local passa pela fila. No Redis, o snapshot usa `GET`.
- **Escrita em arquivo:** gravo em arquivo temporário e renomeio para reduzir o risco de arquivo parcialmente escrito; isso não cobre todas as falhas de máquina ou sistema de arquivos.
- **Resposta:** só depois de gravar. Um 201 significa "persistido".

## Consequências

- **Um processo só.** A fila vive na memória: duas instâncias gravando no mesmo arquivo não ficam protegidas. Registro isso como limite no README.
- Cada criação reescreve o arquivo inteiro. É irrelevante neste volume, e é exatamente o que a migração para um banco resolveria.
- **Prova (CA-22):** N criações simultâneas (`Promise.all`) para a mesma sala e horário devem devolver exatamente um 201 e N−1 respostas 409, com o arquivo ainda em JSON válido.

## Alternativas descartadas

- **`await` entre checar e gravar:** tem a corrida.
- **Operação síncrona em memória:** só serve sem persistência em disco.
- **Trava de arquivo (`proper-lockfile`):** resolve vários processos, que não existem aqui.
- **Banco com transação:** é o caminho de migração, não o ponto de partida.
