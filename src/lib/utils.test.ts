import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, cn } from "./utils";

describe("formatCurrency", () => {
  it("formatea MXN por defecto con símbolo de peso", () => {
    expect(formatCurrency(1500)).toBe("$1,500.00");
  });

  it("respeta la moneda pasada explícitamente", () => {
    const usd = formatCurrency(99.5, "USD");
    expect(usd).toContain("99.50");
  });

  it("maneja cero sin lanzar", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatDate", () => {
  it("acepta un objeto Date", () => {
    const result = formatDate(new Date("2026-03-15T00:00:00"));
    expect(result).toMatch(/mar/i);
    expect(result).toContain("2026");
  });

  it("acepta un string ISO", () => {
    const result = formatDate("2026-01-01T00:00:00");
    expect(result).toContain("2026");
  });
});

describe("cn", () => {
  it("combina clases y resuelve conflictos de tailwind-merge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignora valores falsy", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
