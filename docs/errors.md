# Errors and exception handling

## Purpose

How failures look on the wire and which exception the SDK throws, so you can
decide what to show, what to log and what to retry.

## Response shapes

Most transaction and general endpoints wrap the body. On success the SDK returns
`response_data` and drops the wrapper:

```json
{ "success": true, "response_code": 200, "response_data": {}, "message": "..." }
```

Business error:

```json
{
  "success": false,
  "response_code": 400,
  "response_data": { "errors": { "field": ["message"] } },
  "message": "Human-readable summary"
}
```

Paginated lists (`count`, `next`, `previous`, `results`) and other plain
responses (payment links, sellers, transfers) are returned as they are. Token
exchange and some auth failures use the default DRF shapes, for example
`{ "client_id": ["Invalid client_id"] }` or
`{ "detail": "Authentication credentials were not provided." }`.

## Exceptions

| Class | When | Useful fields |
| --- | --- | --- |
| `ApiException` | HTTP status 400 or above, or a `success: false` envelope | `message`, `statusCode`, `errors` (field to messages, from `response_data.errors`), `responseBody` |
| `AuthenticationException` | token exchange failed, or 401 after one refresh | `message` |
| `WebhookSignatureException` | `webhooks.verifyOrFail` with a bad signature | `message` |
| `AggregatorException` | base class of all of the above | |

`ApiException.statusCode` is `0` when the request never produced a response
(network failure or timeout, message "HTTP request failed: <url>").

The `message` comes from the envelope `message`, else the body's `detail` or
`message`, else a generic text.

## Status codes you can meet

The contract documents these; it does not list others and the SDK invents none.

| Status | Meaning |
| --- | --- |
| 400 | validation or business error (see `errors`); for example `errors.payment_currency: ["no_quote: ..."]` |
| 401 | missing or invalid token; the SDK refreshes and retries once |
| 403 | missing API key scope; or, with `X-Merchant-Account`, a seller that is unknown, not yours or not active |
| 404 | status check: no such transaction |
| 409 | `Idempotency-Key` reused with another body, or while the first request is still running |

A provider failure on a deposit or payout is not reported as final failure: the
call answers `PENDING` (HTTP 202) and a [status check](status.md) or the webhook
settles it. Failures caught before the provider is called (validation, limits,
balance) are final `FAILED`.

## Handling

```ts
import { ApiException, AuthenticationException } from "@mainmoneyapp/sdk";

try {
  await client.deposits.create(payload, idempotencyKey);
} catch (error) {
  if (error instanceof AuthenticationException) {
    // credentials wrong or revoked: alert your team, do not retry in a loop
  } else if (error instanceof ApiException) {
    if (error.statusCode === 400) {
      console.warn("Rejected:", error.message, error.errors);
      // show a safe message to the customer, fix the request
    } else if (error.statusCode === 409) {
      // same Idempotency-Key with a different body, or still processing
    } else if (error.statusCode === 0 || error.statusCode >= 500) {
      // outcome unknown: retry the SAME request with the SAME Idempotency-Key,
      // or look the transaction up with status.check before creating anything new
    }
  } else {
    throw error;
  }
}
```

Never forward `error.message`, `error.errors` or `error.responseBody` raw to a
browser; log them server-side and return your own text. The contract does not
promise that messages are safe to display.

Retry only creates that carry an `Idempotency-Key` (see [Idempotency](idempotency.md)).
The SDK performs no automatic retries other than the single token refresh.

## Complete minimal example

```ts
import { ApiException, Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: "...", secret: "...", test: true });

try {
  await client.status.check("deposit", "ORDER-DOES-NOT-EXIST");
} catch (error) {
  if (error instanceof ApiException && error.statusCode === 404) {
    console.log("Unknown reference");
  } else {
    throw error;
  }
}
```
