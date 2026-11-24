import { describe, expect, it } from "vitest";

import { Client } from "../src/client.js";
import { HttpResponse } from "../src/http/http-response.js";
import { MockHttpClient } from "./mock-http-client.js";

function tokenResponse(): HttpResponse {
  return new HttpResponse(
    200,
    JSON.stringify({
      access_token: "tok_1",
      token_type: "Bearer",
      expires_in: 3600,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    }),
  );
}

function json(status: number, body: unknown): HttpResponse {
  return new HttpResponse(status, JSON.stringify(body));
}

function setup(responses: HttpResponse[], extra: { merchantAccount?: string | null } = {}) {
  const mock = new MockHttpClient();
  mock.enqueue(tokenResponse(), ...responses);
  const client = new Client({
    clientId: "id",
    secret: "secret",
    baseUri: "https://example.test/api/v1/",
    httpClient: mock,
    ...extra,
  });
  return { client, mock };
}

const envelope = (data: unknown) => ({ success: true, response_code: 200, response_data: data, message: "ok" });
const ACCOUNT = "11111111-1111-4111-8111-111111111111";

describe("sellers", () => {
  it("lists countries and sellers without an account header", async () => {
    const { client, mock } = setup([
      json(200, [{ id: "c1", code: "KE", name: "Kenya" }]),
      json(200, { count: 1, results: [{ id: ACCOUNT, name: "Shop" }] }),
    ]);
    const countries = await client.sellers.countries();
    const sellers = await client.sellers.list();
    expect(countries[0].code).toBe("KE");
    expect(sellers.results[0].id).toBe(ACCOUNT);
    expect(mock.history[1].uri).toBe("https://example.test/api/v1/sellers/countries/");
    expect(mock.history[2].uri).toBe("https://example.test/api/v1/sellers/");
    expect(mock.history[2].options.headers?.["X-Merchant-Account"]).toBeUndefined();
  });

  it("creates, reads and updates a seller", async () => {
    const { client, mock } = setup([
      json(201, { id: ACCOUNT, sub_merchant_type: "LEGAL" }),
      json(200, { id: ACCOUNT, kyb: { status: "DRAFT" } }),
      json(200, { id: ACCOUNT, name: "New" }),
    ]);
    await client.sellers.create({ sub_type: "LEGAL", name: "Shop", email: "a@b.co", country: "c1" });
    const detail = await client.sellers.get(ACCOUNT);
    await client.sellers.update(ACCOUNT, { name: "New" });
    expect(detail.kyb.status).toBe("DRAFT");
    expect(mock.history[1]).toMatchObject({ method: "POST", uri: "https://example.test/api/v1/sellers/" });
    expect(mock.history[1].options.json).toMatchObject({ sub_type: "LEGAL", country: "c1" });
    expect(mock.history[2]).toMatchObject({ method: "GET", uri: `https://example.test/api/v1/sellers/${ACCOUNT}/` });
    expect(mock.history[3]).toMatchObject({ method: "PATCH", uri: `https://example.test/api/v1/sellers/${ACCOUNT}/` });
    expect(mock.history[3].options.json).toEqual({ name: "New" });
  });

  it("drives the KYB flow and the onboarding link", async () => {
    const { client, mock } = setup([
      json(200, { status: "DRAFT" }),
      json(200, { status: "DRAFT", jurisdiction: "KE" }),
      json(201, { status: "DRAFT", capture_token: { token: "t", expires_at: "x", upload_url: "https://up.test/" } }),
      json(202, { status: "IN_REVIEW" }),
      json(201, { url: "https://onboard.test/x", token: "t", expires_at: "x" }),
      json(200, { revoked: 1 }),
    ]);
    await client.sellers.kyb(ACCOUNT);
    await client.sellers.updateKyb(ACCOUNT, {
      jurisdiction: "KE",
      ubos: [{ name: "Ada", ownership_pct: "60.00" }],
    });
    const started = await client.sellers.startKyb(ACCOUNT);
    const submitted = await client.sellers.submitKyb(ACCOUNT);
    const link = await client.sellers.createOnboardingLink(ACCOUNT);
    const revoked = await client.sellers.revokeOnboardingLink(ACCOUNT);

    expect(started.capture_token?.upload_url).toBe("https://up.test/");
    expect(submitted.status).toBe("IN_REVIEW");
    expect(link.url).toBe("https://onboard.test/x");
    expect(revoked.revoked).toBe(1);
    const base = `https://example.test/api/v1/sellers/${ACCOUNT}`;
    expect(mock.history.slice(1).map((h) => `${h.method} ${h.uri}`)).toEqual([
      `GET ${base}/kyb/`,
      `PATCH ${base}/kyb/`,
      `POST ${base}/kyb/start/`,
      `POST ${base}/kyb/submit/`,
      `POST ${base}/onboarding-link/`,
      `DELETE ${base}/onboarding-link/`,
    ]);
    expect(mock.history[2].options.json).toMatchObject({ jurisdiction: "KE" });
  });
});

describe("transfers", () => {
  const transfer = {
    id: "t1",
    reference: "TR-1",
    direction: "TO_SUB_MERCHANT",
    sub_merchant_id: ACCOUNT,
    amount: "10.00",
    currency: "USD",
  };

  it("creates, lists and gets transfers", async () => {
    const { client, mock } = setup([json(201, transfer), json(200, [transfer]), json(200, transfer)]);
    const created = await client.transfers.create({
      reference: "TR-1",
      direction: "TO_SUB_MERCHANT",
      sub_merchant_id: ACCOUNT,
      amount: "10.00",
      currency: "USD",
    });
    const list = await client.transfers.list({ sub_merchant_id: ACCOUNT });
    const one = await client.transfers.get("t1");
    expect(created.reference).toBe("TR-1");
    expect(Array.isArray(list)).toBe(true);
    expect(one.id).toBe("t1");
    expect(mock.history[1].uri).toBe("https://example.test/api/v1/transactions/transfers/");
    expect(mock.history[1].options.json).toMatchObject({ direction: "TO_SUB_MERCHANT", amount: "10.00" });
    expect(mock.history[2].options.query).toEqual({ sub_merchant_id: ACCOUNT });
    expect(mock.history[3].uri).toBe("https://example.test/api/v1/transactions/transfers/t1/");
  });

  it("never sends the client-wide X-Merchant-Account on transfers or sellers", async () => {
    const { client, mock } = setup([json(200, []), json(200, { count: 0, results: [] })], { merchantAccount: ACCOUNT });
    await client.transfers.list();
    await client.sellers.list();
    expect(mock.history[1].options.headers?.["X-Merchant-Account"]).toBeUndefined();
    expect(mock.history[2].options.headers?.["X-Merchant-Account"]).toBeUndefined();
  });
});

describe("pricing and reports", () => {
  it("gets pricing with filters", async () => {
    const { client, mock } = setup([json(200, { items: [{ operation_type: "DEPOSIT", total_merchant_fee: "1.00" }] })]);
    const pricing = await client.pricing.get({ operation_type: "DEPOSIT" });
    expect(pricing.items[0].operation_type).toBe("DEPOSIT");
    expect(mock.history[1].uri).toBe("https://example.test/api/v1/manage/general/pricing/");
    expect(mock.history[1].options.query).toEqual({ operation_type: "DEPOSIT" });
  });

  it("gets charts and summary, with the seller header on request", async () => {
    const { client, mock } = setup([
      json(200, { volume_by_day: [{ date: "2026-01-01", currency: "USD", count: 1, total_amount: "5.00" }] }),
      json(200, { totals_by_provider: [], top_transactions: [] }),
    ]);
    const charts = await client.reports.charts({ currency: "USD", date_from: "2026-01-01" }, { merchantAccount: ACCOUNT });
    await client.reports.summary();
    expect(charts.volume_by_day[0].count).toBe(1);
    expect(mock.history[1].uri).toBe("https://example.test/api/v1/manage/merchant-admin/reports/charts/");
    expect(mock.history[1].options.headers?.["X-Merchant-Account"]).toBe(ACCOUNT);
    expect(mock.history[2].uri).toBe("https://example.test/api/v1/manage/merchant-admin/reports/summary/");
    expect(mock.history[2].options.headers?.["X-Merchant-Account"]).toBeUndefined();
  });
});

describe("card paths", () => {
  it("posts card deposit validation and card business payouts without account or idempotency headers", async () => {
    const { client, mock } = setup(
      [json(200, envelope({ status: "SUCCESS" })), json(201, envelope({ status: "PENDING" }))],
      { merchantAccount: ACCOUNT },
    );
    await client.deposits.validateCardPayment({ reference: "D-1" });
    await client.payouts.createCardBusinessMerchantAccount({ reference: "P-1" });
    expect(mock.history[1].uri).toBe("https://example.test/api/v1/transactions/card-deposits/validate-payment/");
    expect(mock.history[2].uri).toBe("https://example.test/api/v1/transactions/card-payouts/business/merchant-account/");
    for (const call of mock.history.slice(1)) {
      expect(call.options.headers?.["X-Merchant-Account"]).toBeUndefined();
      expect(call.options.headers?.["Idempotency-Key"]).toBeUndefined();
    }
  });
});

describe("X-Merchant-Account", () => {
  it("is absent by default and set per call on every supporting resource", async () => {
    const ok = envelope({ status: "PENDING" });
    const { client, mock } = setup(Array.from({ length: 10 }, () => json(200, ok)));
    const opt = { merchantAccount: ACCOUNT };
    await client.deposits.create({ reference: "a" }, "k1", opt);
    await client.deposits.validatePayment({}, opt);
    await client.payouts.create({ reference: "a" }, null, opt);
    await client.payouts.createBusiness({ reference: "a" }, null, opt);
    await client.payouts.createBusinessMerchantAccount({ reference: "a" }, null, opt);
    await client.refunds.create({ reference: "a" }, null, opt);
    await client.remittances.create({ reference: "a" }, null, opt);
    await client.status.check("deposit", "a", opt);
    await client.wallets.list({}, opt);
    await client.transactions.list("deposit", {}, opt);
    for (const call of mock.history.slice(1)) {
      expect(call.options.headers?.["X-Merchant-Account"]).toBe(ACCOUNT);
    }
    expect(mock.history[1].options.headers?.["Idempotency-Key"]).toBe("k1");
  });

  it("uses the client-wide default, lets a call override it and lets null disable it", async () => {
    const ok = envelope({});
    const { client, mock } = setup([json(200, ok), json(200, ok), json(200, ok)], { merchantAccount: ACCOUNT });
    await client.deposits.create({ reference: "a" });
    await client.deposits.create({ reference: "b" }, null, { merchantAccount: "other" });
    await client.deposits.create({ reference: "c" }, null, { merchantAccount: null });
    expect(mock.history[1].options.headers?.["X-Merchant-Account"]).toBe(ACCOUNT);
    expect(mock.history[2].options.headers?.["X-Merchant-Account"]).toBe("other");
    expect(mock.history[3].options.headers?.["X-Merchant-Account"]).toBeUndefined();
  });

  it("applies the client-wide default to payment links", async () => {
    const { client, mock } = setup([json(200, { count: 0, results: [] })], { merchantAccount: ACCOUNT });
    await client.paymentLinks.list();
    expect(mock.history[1].options.headers?.["X-Merchant-Account"]).toBe(ACCOUNT);
  });
});
