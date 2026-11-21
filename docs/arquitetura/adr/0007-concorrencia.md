# ADR 0007. Concorrência na criação de reservas

## Contexto

Duas empresas reservam a mesma sala no mesmo horário ao mesmo tempo. O correto é **um 201 e um 409**. A falha clássica é a corrida entre checar e gravar: cada `await` devolve o controle ao event loop, outra requisição lê o mesmo estado antigo e as duas "reservam". Com persistência em arquivo há um segundo risco: duas escritas simultâneas corrompem o arquivo.

## Decisão

Uso **uma fila que executa uma escrita por vez**, com **a leitura, a checagem de conflito e a gravação dentro dela**.

```ts
await queue.run(async () => {
  const conflict = findConflict(state.bookings, nova);          // lê
  if (conflict) throw new AppError(ErrorCode.BOOKING_CONFLICT); // decide
  state.bookings.push(nova);                                    // altera
  await persistAtomically(state);                               // grava (tmp + rename)
});
```

Se a fila serializasse só o ato de gravar e a checagem ficasse fora, a corrida continuaria.

| Peça | Função |
| --- | --- |
| Estado em memória | Lido uma vez ao subir. As consultas não passam pela fila |
| Fila | A próxima escrita só começa quando a anterior termina |
| Escrita atômica | Gravo em arquivo temporário e renomeio. Queda no meio não corrompe |
| Resposta | Só depois de gravar. Um 201 significa "persistido" |

## Consequências

- **Um processo só.** A fila vive na memória: duas instâncias gravando no mesmo arquivo não são protegidas. Documento isso como limite no README.
- Cada criação reescreve o arquivo inteiro. Irrelevante neste volume; é o que a migração para banco resolveria.

## Alternativas

| Opção | Por que não escolhi |
| --- | --- |
| Checar e gravar com `await` entre os dois | Tem a corrida |
| Operação síncrona em memória | Só serve sem persistência em disco |
| Trava de arquivo (`proper-lockfile`) | Resolve vários processos, que não existem aqui |
| Banco com transação | Caminho de migração, não ponto de partida |

## Prova (QA)

CA-22: N criações simultâneas (`Promise.all`) para a mesma sala e horário devem devolver exatamente um 201 e N−1 respostas 409, e o arquivo deve continuar JSON válido.
