# MainMoney Node.js SDK

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
npm install @mainmoney/sdk
```

Until the package is on npm, install from GitHub:

```bash
npm install github:MainMoney-Inc/mm_aggr_nodejs_sdk
```

## Quick start

```ts
import { Client } from "@mainmoney/sdk";

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
SDK. There is no `X-API-KEY` header. Reuse the same `reference` and optional
`Idempotency-Key` when retrying a create. Amounts are decimal strings; do not
mix currencies.

Verify inbound webhooks with
`client.webhooks.verify(rawBody, signature, secret)`.

Do not send merchant API keys to the browser.

## License

Copyright (c) 2026 MainMoney SARL. Licensed under the PolyForm Noncommercial
License 1.0.0. Non-commercial use is allowed. Commercial use requires
permission from MainMoney SARL. See [LICENSE](LICENSE).

## Examples

A runnable Express mini-shop lives in [examples/express](examples/express).
Pair it with a
[JS/TS frontend example](https://github.com/MainMoney-Inc/mm_aggr_js_sdk/tree/main/examples).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).
