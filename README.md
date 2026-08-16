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

## Quick start

```ts
import { AggregatorClient } from "@mainmoney/sdk";

const client = new AggregatorClient({
  baseUri: "https://your-aggregator.example/api/v1/",
  apiKey: process.env.MM_API_KEY ?? "",
});
```

See `/api/v1/docs/merchants/` on your aggregator host. Payment methods will be
added in a later release.

## License

Copyright (c) 2026 MainMoney SARL. Licensed under the PolyForm Noncommercial
License 1.0.0. Non-commercial use is allowed. Commercial use requires
permission from MainMoney SARL. See [LICENSE](LICENSE).

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).
