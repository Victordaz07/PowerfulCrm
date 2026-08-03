import { describe, it, expect, vi, beforeEach } from "vitest";

const constructEventMock = vi.fn();
const updateManyMock = vi.fn();

vi.mock("stripe", () => {
  return {
    default: class StripeMock {
      webhooks = { constructEvent: constructEventMock };
    },
  };
});

vi.mock("@/lib/prisma", () => ({
  rawPrisma: {
    invoice: { updateMany: (...args: unknown[]) => updateManyMock(...args) },
  },
}));

process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";

import { POST } from "./route";

function makeRequest(body: string, signature = "sig") {
  return new Request("https://powerful-crm.vercel.app/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: { "stripe-signature": signature },
  });
}

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    constructEventMock.mockReset();
    updateManyMock.mockReset();
  });

  it("responde 400 si la firma es inválida, sin tocar la base de datos", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("firma mala");
    });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(400);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("marca la factura como PAGADA cuando checkout.session.completed trae invoiceId", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { invoiceId: "inv_123" },
          payment_intent: "pi_123",
        },
      },
    });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    const [args] = updateManyMock.mock.calls[0];
    expect(args.where).toEqual({ id: "inv_123", status: { not: "PAGADA" } });
    expect(args.data.status).toBe("PAGADA");
    expect(args.data.stripePaymentIntentId).toBe("pi_123");
  });

  it("no toca la base de datos si el evento no trae invoiceId en metadata", async () => {
    constructEventMock.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: {}, payment_intent: "pi_999" } },
    });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("ignora tipos de evento que no maneja, sin error", async () => {
    constructEventMock.mockReturnValue({ type: "customer.created", data: { object: {} } });

    const res = await POST(makeRequest("{}"));

    expect(res.status).toBe(200);
    expect(updateManyMock).not.toHaveBeenCalled();
  });
});
