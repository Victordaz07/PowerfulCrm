import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({
  auth: () => authMock(),
}));

import { isTenantAdmin, requireTenantAdmin } from "./authz";

describe("isTenantAdmin", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("es true para org:admin", async () => {
    authMock.mockResolvedValue({ orgRole: "org:admin" });
    expect(await isTenantAdmin()).toBe(true);
  });

  it("es true para org:owner", async () => {
    authMock.mockResolvedValue({ orgRole: "org:owner" });
    expect(await isTenantAdmin()).toBe(true);
  });

  it("es false para org:member", async () => {
    authMock.mockResolvedValue({ orgRole: "org:member" });
    expect(await isTenantAdmin()).toBe(false);
  });

  it("es false sin orgRole (sin sesión de organización)", async () => {
    authMock.mockResolvedValue({ orgRole: null });
    expect(await isTenantAdmin()).toBe(false);
  });
});

describe("requireTenantAdmin", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("no lanza para un admin", async () => {
    authMock.mockResolvedValue({ orgRole: "org:admin" });
    await expect(requireTenantAdmin()).resolves.toBeUndefined();
  });

  it("lanza para un member", async () => {
    authMock.mockResolvedValue({ orgRole: "org:member" });
    await expect(requireTenantAdmin()).rejects.toThrow(/administrador/i);
  });
});
