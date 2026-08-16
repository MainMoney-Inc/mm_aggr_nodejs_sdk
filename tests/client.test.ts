import { describe, expect, it } from "vitest";

import { Client } from "../src/client.js";
import { ApiException, AuthenticationException } from "../src/errors.js";
import { HttpResponse } from "../src/http/http-response.js";
import { MockHttpClient } from "./mock-http-client.js";

function clientWithMock(responses: HttpResponse[]): { client: Client; mock: MockHttpClient } {
  const mock = new MockHttpClient();
  mock.enqueue(...responses);
  const client = new Client({
    clientId: "client-id",
    secret: "secret",
    baseUri: "https://example.test/api/v1/",
    httpClient: mock,
  });
  return { client, mock };
}

function tokenResponse(token = "tok_1"): HttpResponse {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return new HttpResponse(
    200,
    JSON.stringify({
      access_token: token,
      token_type: "Bearer",
      expires_in: 3600,
      expires_at: expiresAt,
    }),
  );
}

describe("Client", () => {
  it("exchanges a token then sends Bearer on the follow-up", async () => {
    const { client, mock } = clientWithMock([
      tokenResponse(),
      new HttpResponse(
        200,
        JSON.stringify({
          success: true,
          response_code: 202,
          response_data: { status: "PENDING", merchant_reference: "ORDER-1" },
          message: "ok",
        }),
      ),
    ]);

    const result = await client.deposits.create({
      provider_code: "VODACOM_MPESA_COD",
      reference: "ORDER-1",
      amount: "100.00",
      currency: "USD",
      customer_phone: "243820000000",
    });

    expect(result).toMatchObject({ status: "PENDING" });
    expect(mock.history).toHaveLength(2);

    const exchange = mock.history[0];
    expect(exchange.method).toBe("POST");
    expect(exchange.uri).toContain("/auth/tokens/exchange/");
    expect(exchange.options.headers?.Authorization).toBeUndefined();
    expect(exchange.options.json).toMatchObject({ client_id: "client-id", secret: "secret" });

    const deposit = mock.history[1];
    expect(deposit.options.headers?.Authorization).toBe("Bearer tok_1");
    expect(deposit.options.headers?.["X-API-KEY"]).toBeUndefined();
    expect(deposit.options.headers?.["Idempotency-Key"]).toBeUndefined();
    expect(deposit.options.json).toMatchObject({
      reference: "ORDER-1",
      amount: "100.00",
      currency: "USD",
      provider_code: "VODACOM_MPESA_COD",
      customer_phone: "243820000000",
    });
  });

  it("caches the token across calls", async () => {
    const { client, mock } = clientWithMock([
      tokenResponse(),
      new HttpResponse(200, JSON.stringify({ count: 1, next: null, previous: null, results: [] })),
      new HttpResponse(200, JSON.stringify({ count: 0, next: null, previous: null, results: [] })),
    ]);

    await client.countries.list();
    await client.wallets.list();

    expect(mock.history).toHaveLength(3);
    expect(mock.history[0].uri).toContain("/auth/tokens/exchange/");
    expect(mock.history[1].uri).toContain("/manage/general/countries/");
    expect(mock.history[2].uri).toContain("/manage/merchant-admin/wallets/");
  });

  it("retries once after unauthorized by re-exchanging the token", async () => {
    const { client, mock } = clientWithMock([
      tokenResponse("tok_old"),
      new HttpResponse(401, JSON.stringify({ detail: "Token expired" })),
      tokenResponse("tok_new"),
      new HttpResponse(
        200,
        JSON.stringify({
          success: true,
          response_data: { status: "SUCCESS" },
          message: "ok",
        }),
      ),
    ]);

    const result = await client.status.check("deposit", "ORDER-1");
    expect(result).toMatchObject({ status: "SUCCESS" });
    expect(mock.history).toHaveLength(4);
    expect(mock.history[3].options.headers?.Authorization).toBe("Bearer tok_new");
  });

  it("fails when the second unauthorized response arrives", async () => {
    const { client, mock } = clientWithMock([
      tokenResponse("tok_old"),
      new HttpResponse(401, "{}"),
      tokenResponse("tok_new"),
      new HttpResponse(401, "{}"),
    ]);

    await expect(client.countries.list()).rejects.toBeInstanceOf(AuthenticationException);
    expect(mock.history.length).toBeGreaterThan(0);
  });

  it("does not unwrap paginated lists", async () => {
    const { client } = clientWithMock([
      tokenResponse(),
      new HttpResponse(
        200,
        JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [{ code: "KE" }],
        }),
      ),
    ]);

    const page = await client.countries.list();
    expect(page).toMatchObject({ count: 1, results: [{ code: "KE" }] });
  });

  it("sends Idempotency-Key only when provided", async () => {
    const { client, mock } = clientWithMock([
      tokenResponse(),
      new HttpResponse(
        200,
        JSON.stringify({
          success: true,
          response_data: { status: "PENDING" },
          message: "ok",
        }),
      ),
    ]);

    await client.payouts.create(
      {
        provider_code: "MPESA_KE",
        reference: "PAY-1",
        amount: "50.00",
        currency: "KES",
        destination_account: "254700000000",
      },
      "PAY-1",
    );

    const payout = mock.history[1];
    expect(payout.options.headers?.["Idempotency-Key"]).toBe("PAY-1");
    expect(payout.options.headers?.["X-API-KEY"]).toBeUndefined();
  });

  it("surfaces envelope error messages", async () => {
    const { client } = clientWithMock([
      tokenResponse(),
      new HttpResponse(
        400,
        JSON.stringify({
          success: false,
          response_code: 400,
          response_data: { errors: { reference: ["already exists"] } },
          message: "Duplicate reference",
        }),
      ),
    ]);

    const exception = await client.deposits
      .create({
        provider_code: "MPESA_KE",
        reference: "DUP",
        amount: "1.00",
        currency: "KES",
        customer_phone: "+254700000000",
      })
      .catch((error: unknown) => error);

    expect(exception).toBeInstanceOf(ApiException);
    const apiException = exception as ApiException;
    expect(apiException.message).toBe("Duplicate reference");
    expect(apiException.statusCode).toBe(400);
    expect(apiException.errors).toEqual({ reference: ["already exists"] });
  });

  it("defaults base URI to production", () => {
    const client = new Client({
      clientId: "client-id",
      secret: "secret",
      httpClient: new MockHttpClient(),
    });
    expect(client.baseUri).toBe(Client.PRODUCTION_BASE_URI);
  });

  it("uses the test aggregator when test is true", () => {
    const client = new Client({
      clientId: "client-id",
      secret: "secret",
      test: true,
      httpClient: new MockHttpClient(),
    });
    expect(client.baseUri).toBe(Client.TEST_BASE_URI);
  });

  it("normalizes a custom host without the API prefix", () => {
    const client = new Client({
      clientId: "client-id",
      secret: "secret",
      baseUri: "https://aggregator.mainmoney.net",
      httpClient: new MockHttpClient(),
    });
    expect(client.baseUri).toBe(Client.PRODUCTION_BASE_URI);
  });
});
