# ADR 0006. Tempo, fuso horário e expediente

## Decisão

Trato o tempo com rigor, porque quase todo bug de reserva é bug de tempo.

1. **ISO 8601 com fuso explícito.** Formato ambíguo (data sem hora, hora sem fuso) é rejeitado com 400. Não corrijo nada em silêncio: `2026-02-30` é erro, não 02 de março.
2. **Fuso `America/Sao_Paulo`, convertido com `Intl`**, sem offset fixo `-03:00`. É configurável por `COWORKING_TIMEZONE`.
3. **Relógio injetado** (`now: () => Date`) nos services, para os testes controlarem a hora.
4. **Expediente das 07:00 às 22:00** como regra de negócio (`OUTSIDE_OPENING_HOURS`, 422). Por isso nenhuma reserva cruza a meia-noite.
5. **Intervalo semiaberto** `[início, fim)`: reservas coladas (10:00–11:00 e 11:00–12:00) não conflitam.

`GET /api/rooms/:id/availability?date=` devolve toda reserva que se sobrepõe ao dia local, de 00:00 a 24:00 no fuso do coworking.

### Por que `Intl` e não `-03:00`

O offset fixo está certo hoje, porque o Brasil não tem horário de verão desde 2019, mas é uma suposição escondida: em 2018 São Paulo estava em `-02:00`. Com `Intl` o fuso carrega as regras de cada época. O teste TZ-03 prova isso: o dia `2018-11-20` tem limites calculados com `-02:00`.

### Como cada entrada é tratada

| Entrada | Resultado |
| --- | --- |
| `2026-11-20T14:00:00.000Z` | Aceita |
| `2026-11-20T11:00:00-03:00` | Aceita |
| `2026-11-20T14:00:00` (sem fuso) | 400 |
| `2026-02-30` em `date` | 400 `INVALID_DATE` |
| `endsAt` igual ou antes de `startsAt` | 422 `END_BEFORE_START` |
| Início antes das 07:00 ou fim depois das 22:00 | 422 `OUTSIDE_OPENING_HOURS` |

O `Date` do JavaScript corrige datas impossíveis e lê strings sem fuso no fuso da máquina. Por isso valido **antes** de qualquer `new Date`.

## Consequências

- **Ganho:** o cálculo fica correto em qualquer época e em outras regiões, por configuração, e a entrada ambígua é barrada na borda.
- **Custo:** calcular o início do dia é mais elaborado que somar `-3h`, e o front precisa enviar fuso explícito.
- **Front-end:** lê `COWORKING_TIMEZONE` pelo endpoint autenticado `/api/config` e converte para ISO na função `apps/web/src/services/time.ts`.
