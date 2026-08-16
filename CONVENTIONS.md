# Conventions

- Node.js 22+ (develop on 24 Active LTS). TypeScript strict mode.
- ESM (`"type": "module"`). Vitest. No merchant API keys in logs.
- HTTP via injectable `HttpClient` (default `FetchHttpClient`, Node 22+ `fetch`).
- Currency: never mix amounts across currencies.
- Do not call the aggregator from this SDK with invented paths.
