# Authentication

## Purpose

Every merchant call carries `Authorization: Bearer <access_token>`. You never send
the API key secret on a normal call, and there is no `X-API-KEY` header. The SDK
exchanges your credentials for a token, caches it and refreshes it for you.

## Prerequisites

- A merchant application with a `client_id` and an API key `secret`.
- Server-side code only. Never put either value in a browser, mobile app or plugin
  JavaScript.
- Scopes: an application has `allowed_scopes`. The contract's scope list is
  `all_scopes`, `DEPOSIT`, `CARD_DEPOSIT`, `PAYOUT`, `CARD_PAYOUT`,
  `BUSINESS_PAYOUT`, `REMITTANCE`, `REFUND`, `CUSTOMER_LOOKUP`, `USER_KYC`,
  `PAYMENT_LINK`, `TRANSACTION_STATUS_CHECK`, `MERCHANT_WALLET_READ`,
  `GENERAL_READ`, `ACT_ON_BEHALF`, `MERCHANT_TRANSFER` and others. The contract
  states the required scope explicitly only for business payouts
  (`BUSINESS_PAYOUT`) and payment links (`PAYMENT_LINK`); for the rest, match the
  scope to the operation by name. A call without the needed scope answers HTTP 403.

## Create the client

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({
  clientId: process.env.MM_CLIENT_ID ?? "",
  secret: process.env.MM_API_SECRET ?? "",
  test: true,            // https://testaggregator.mainmoney.net/api/v1/ ; omit for production
});
```

| Option | Meaning |
| --- | --- |
| `clientId`, `secret` | credentials (required) |
| `test` | use the test aggregator; default is production `https://aggregator.mainmoney.net/api/v1/` |
| `baseUri` | override the host; `/api/v1/` is appended when missing |
| `timeout` | seconds for the default `fetch` client (default 30) |
| `tokenExpiresIn` | `expires_in` requested at exchange: 60 to 86400 seconds, default 3600 |
| `httpClient` | your own `HttpClient` implementation (tests, proxies) |
| `merchantAccount` | default seller for [MainMoney Rails](mainmoney-rails.md) |

## Token exchange (what the SDK does)

`POST /auth/tokens/exchange/` without an `Authorization` header:

```json
{ "client_id": "<client_id>", "secret": "<secret>", "expires_in": 3600 }
```

```json
{
  "access_token": "<token>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": "2026-01-01T12:00:00Z"
}
```

The SDK exchanges lazily on the first call, reuses the token until shortly before
`expires_at`, and exchanges again after that. If a call answers HTTP 401 it drops
the token, exchanges once more and retries that call once. A second 401 throws.
Concurrent first calls are not coordinated, so a burst may exchange more than once;
that is harmless.

## Errors

| Situation | What you get |
| --- | --- |
| wrong `client_id` / `secret`, or exchange refused | `AuthenticationException` ("Token exchange failed") |
| 401 again after the retry | `AuthenticationException` ("Authentication failed") |
| missing scope | `ApiException` with `statusCode` 403 |

## Complete minimal example

```ts
import { AuthenticationException, Client } from "@mainmoneyapp/sdk";

const client = new Client({
  clientId: process.env.MM_CLIENT_ID ?? "",
  secret: process.env.MM_API_SECRET ?? "",
  test: true,
});

try {
  const page = await client.countries.list(); // first call triggers the exchange
  console.log("credentials OK", page);
} catch (error) {
  if (error instanceof AuthenticationException) {
    console.error("Check MM_CLIENT_ID / MM_API_SECRET and the environment (test vs production).");
  } else {
    throw error;
  }
}
```
