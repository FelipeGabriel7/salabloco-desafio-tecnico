import { describe, expect, it } from "vitest";
import { authenticateToken } from "../../src/shared/config.ts";

describe("comparação de token", () => {
  it("token certo identifica a empresa", () => {
    expect(authenticateToken("acme-test-token")).toBe("acme");
    expect(authenticateToken("lumen-test-token")).toBe("lumen");
  });

  it.each([
    ["token errado do mesmo tamanho", "acme-test-tokex"],
    ["token mais curto", "acme"],
    ["token mais longo", "acme-test-token-extra"],
    ["token vazio", ""],
  ])("%s não identifica empresa", (_case, token) => {
    expect(authenticateToken(token)).toBeUndefined();
  });
});
