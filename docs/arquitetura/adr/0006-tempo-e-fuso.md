# ADR 0006. Tempo, fuso horário e expediente

## Contexto

Quase todo bug de reserva de sala é bug de tempo: virada de dia, UTC contra horário local, "agora" instável nos testes, datas que parecem válidas e não são.

## Decisão

1. Aceito **ISO 8601 com fuso explícito**. Formato ambíguo (data sem hora, hora sem fuso) é rejeitado com 400. Não corrijo nada em silêncio: `2026-02-30` é erro, não 02 de março.
2. Uso o **fuso `America/Sao_Paulo`, convertido com `Intl`**, sem offset fixo `-03:00`. Ele é configurável por `COWORKING_TIMEZONE`.
3. Injeto o **relógio** (`now: () => Date`) nos services.
4. Defino o **expediente das 07:00 às 22:00** como regra de negócio (`OUTSIDE_OPENING_HOURS`). Por isso nenhuma reserva cruza a meia-noite.
5. Trato o intervalo como **semiaberto** `[início, fim)`: reservas coladas (10:00–11:00 e 11:00–12:00) não conflitam.

`GET /rooms/:id/availability?date=` devolve toda reserva que se sobrepõe ao dia local (00:00 às 24:00 no fuso do coworking).

## Por que `Intl` e não `-03:00`

O offset fixo está certo hoje (o Brasil não tem horário de verão desde 2019), mas é uma suposição escondida: em 2018 São Paulo estava em `-02:00`. Com `Intl` o fuso carrega as regras de cada época. O teste TZ-03 prova isso: o dia `2018-11-20` tem limites calculados com `-02:00`.

## Entradas

| Entrada | Resultado |
| --- | --- |
| `2026-11-20T14:00:00.000Z` | Aceita |
| `2026-11-20T11:00:00-03:00` | Aceita |
| `2026-11-20T14:00:00` (sem fuso) | 400 |
| `2026-02-30` em `date` | 400 `INVALID_DATE` |
| `endsAt` igual ou antes de `startsAt` | 422 `END_BEFORE_START` |
| Início antes das 07:00 ou fim depois das 22:00 | 422 `OUTSIDE_OPENING_HOURS` |

O `Date` do JavaScript corrige datas impossíveis e interpreta strings sem fuso no fuso da máquina. Por isso valido **antes** de qualquer `new Date`.

## Consequências

| Ganho | Custo |
| --- | --- |
| Correto em qualquer época e em outras regiões, por configuração | Calcular o início do dia é mais elaborado que somar `-3h` |
| Entrada ambígua barrada na borda | O front precisa enviar fuso explícito |

O front ainda usa o offset fixo (`apps/web/src/utils/time.ts`) e deve migrar para `Intl` (tarefa W-01).
