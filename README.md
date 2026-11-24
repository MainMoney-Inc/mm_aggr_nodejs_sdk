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
The SDK exchanges `client_id` and `secret` for a Bearer token and refreshes it;
there is no `X-API-KEY` header. Amounts are decimal strings; never mix currencies.
Keep `clientId` and `secret` on the server.

Verify inbound webhooks on the raw request body:

```ts
const ok = client.webhooks.verify(rawBody, req.header("x-webhook-signature") ?? "", process.env.MM_WEBHOOK_SECRET ?? "");
```

## Guides

Detailed, per-flow guides (request and response fields, errors, a complete
example each) are in [docs/](docs/README.md):

| Flow | Guide |
| --- | --- |
| Credentials, token, scopes | [authentication](docs/authentication.md) |
| Countries, providers, provider matching, lookup, limits | [countries and providers](docs/countries-and-providers.md), [customers](docs/customers.md), [amount limits](docs/amount-limits.md) |
| Fees and pricing | [fees](docs/fees.md), [pricing](docs/pricing.md) |
| Deposits, payouts, remittances, refunds | [deposits](docs/deposits.md), [payouts](docs/payouts.md), [remittances](docs/remittances.md), [refunds](docs/refunds.md) |
| Status, polling, webhooks | [status](docs/status.md), [webhooks](docs/webhooks.md) |
| Idempotency and errors | [idempotency](docs/idempotency.md), [errors](docs/errors.md) |
| Payment links | [payment links](docs/payment-links.md) |
| Balances, transactions, reports | [wallets and reports](docs/wallets-and-reports.md) |
| Platforms and sellers (MainMoney Rails) | [MainMoney Rails](docs/mainmoney-rails.md) |
| Browser checkout widget backend | [checkout widget proxy](docs/checkout-widget.md) |

Platforms can act on behalf of a seller with `new Client({ ..., merchantAccount })` or
a per-call `{ merchantAccount }` (sent as `X-Merchant-Account`).

## License

Copyright (c) 2026 MainMoney SARL. Licensed under the MIT License. See [LICENSE](LICENSE).

## Examples

A runnable Express mini-shop lives in [examples/express](examples/express).
Pair it with a
[JS/TS frontend example](https://github.com/MainMoney-Inc/mm_aggr_js_sdk/tree/main/examples).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).
