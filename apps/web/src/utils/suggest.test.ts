import { describe, expect, it } from "vitest";
import { suggestSlots } from "./suggest";

const busy = { savassi: [{ s: 540, e: 630 }, { s: 660, e: 720 }], pampulha: [{ s: 540, e: 750 }], curral: [], liberdade: [] };
const roomIds = ["savassi", "pampulha", "curral", "liberdade"];

describe("suggestSlots", () => {
  it("sugere os horários livres mais próximos na mesma sala e salas livres no mesmo horário", () => {
    const out = suggestSlots({ roomId: "savassi", roomIds, busyByRoom: busy, s: 570, e: 600 });
    const same = out.filter((x) => x.roomId === "savassi");
    expect(same).toEqual([
      { roomId: "savassi", s: 510, e: 540 },
      { roomId: "savassi", s: 630, e: 660 },
    ]);
    const others = out.filter((x) => x.roomId !== "savassi").map((x) => x.roomId);
    expect(others).toEqual(["curral", "liberdade"]);
    expect(out.every((x) => x.e - x.s === 30)).toBe(true);
  });
  it("não sugere horário que já passou", () => {
    const out = suggestSlots({ roomId: "savassi", roomIds, busyByRoom: busy, s: 570, e: 600, earliest: 600 });
    expect(out.filter((x) => x.roomId === "savassi").every((x) => x.s >= 600)).toBe(true);
    expect(out.filter((x) => x.roomId !== "savassi")).toEqual([]);
  });
});
