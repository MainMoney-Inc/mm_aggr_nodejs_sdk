# MainMoney Node.js SDK

[![npm](https://img.shields.io/npm/v/@mainmoneyapp/sdk)](https://www.npmjs.com/package/@mainmoneyapp/sdk) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Server-side TypeScript/JavaScript client for the MainMoney aggregator merchant
API. Install this package in Node.js backends (Express, Nest, Fastify, Next.js
Route Handlers).

For Angular, React, Next.js client components, or other browsers, use the
[JS/TS frontend SDK](https://github.com/MainMoney-Inc/mm_aggr_js_sdk) **and**
keep this SDK (or PHP/Python) on the server. Never put merchant API keys in
the browser.

## Requirements

- Node.js 22 or later (24 Active LTS recommended)
- A merchant application on MM Aggregator

## Install

```bash
npm install @mainmoneyapp/sdk
```

## Quick start

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({
  clientId: process.env.MM_CLIENT_ID ?? "",
  secret: process.env.MM_API_SECRET ?? "",
  test: true, // https://testaggregator.mainmoney.net — omit for production
});

const deposit = await client.deposits.create(
  {
    provider_code: "VODACOM_MPESA_COD",
    reference: "ORDER-123",
    amount: "100.00",
    currency: "USD",
    customer_phone: "243820000000",
  },
  "ORDER-123",
);
```

Defaults: production `https://aggregator.mainmoney.net/api/v1/`, test
`https://testaggregator.mainmoney.net/api/v1/`. Pass `baseUri` only to override.
Configure credentials from your environment. Merchant API docs:
`/api/v1/docs/merchants/` on the aggregator host.

Exchange `client_id` and `secret` for a Bearer access token is handled by the
SDK. There is no `X-API-KEY` header. Resend the same `reference` and
`Idempotency-Key` only when retrying the *same* create (same body). When the body
changes (new phone number, new currency) use a new `Idempotency-Key`; after a
failed deposit also use a new `reference`, because a failed one stays reserved.
Derive the key from your checkout session, not from the cart or order. Amounts are
decimal strings; do not mix currencies.

Verify inbound webhooks with
`client.webhooks.verify(rawBody, signature, secret)`.

Do not send merchant API keys to the browser.

## Payment links

Create a hosted payment page and send the returned `url` to your customer (API key
scope `PAYMENT_LINK` required). Full guide: [docs/payment-links.md](docs/payment-links.md).

```ts
const link = await client.paymentLinks.create({
  reference: "INV-2026-0042",
  amount: "25.00",
  currency: "USD",
  expires_at: "2026-12-31T23:59:59Z",
  single_use: true,
  redirect_url: "https://shop.example.com/thanks",
});
console.log(link.url); // the customer pays here

await client.paymentLinks.list({ status: "ACTIVE" });
await client.paymentLinks.get(link.id);
await client.paymentLinks.cancel(link.id);

// On behalf of a seller (sends X-Merchant-Account):
await client.paymentLinks.get(link.id, { merchantAccount: "<seller account id>" });
```

Failures throw `ApiException` (400 validation, 409 conflict such as a reused
reference). Payments arrive as deposits and webhooks; read `status` with `get`.

## License

Copyright (c) 2026 MainMoney SARL. Licensed under the MIT License. See [LICENSE](LICENSE).

## Examples

A runnable Express mini-shop lives in [examples/express](examples/express).
Pair it with a
[JS/TS frontend example](https://github.com/MainMoney-Inc/mm_aggr_js_sdk/tree/main/examples).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).
