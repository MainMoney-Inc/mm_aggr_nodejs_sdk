# Status check and polling

## Purpose

Ask the aggregator for the current state of a deposit, payout, refund or remittance.
Use it when a create answered `PENDING`, when a webhook is late or lost, and after
an unknown outcome (timeout, 5xx).

## Prerequisites

Scope `TRANSACTION_STATUS_CHECK` (by name). No `Idempotency-Key` on status checks.

## Request

`POST /transactions/status/check/{operation_type}/` ->
`client.status.check(operationType, reference, { merchantAccount? })`

`operationType`: `deposit`, `payout`, `refund` or `remittance`. `reference` is the
`merchant_reference` or the `internal_reference`. The aggregator queries the
provider, updates the local transaction and returns it. Response (HTTP 200):

```json
{
  "status": "SUCCESS",
  "transaction_id": "...",
  "internal_reference": "...",
  "external_reference": "...",
  "merchant_reference": "ORDER-123",
  "timestamp": "2026-01-01T12:01:00Z",
  "provider_reference": null,
  "message": "",
  "error_code": null,
  "error_message": null,
  "data": {},
  "processing_time_ms": null
}
```

Errors: 400 invalid input, 404 unknown reference, 403 scope or seller.

## Polling

The contract names `SUCCESS`, `PENDING` and `FAILED` ("etc."), without a closed list
or rate limits. Poll while the status is `PENDING`, with a growing delay and an
overall deadline, and treat anything else as settled. The webhook remains the
primary signal; polling is the fallback (and the only option on a machine the
aggregator cannot reach, such as localhost).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

async function waitForSettlement(reference: string, deadlineMs = 120_000): Promise<string> {
  const start = Date.now();
  let delay = 2_000;
  while (Date.now() - start < deadlineMs) {
    const result = (await client.status.check("deposit", reference)) as { status: string };
    if (result.status !== "PENDING") return result.status; // SUCCESS, FAILED, ...
    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 15_000);
  }
  return "PENDING"; // still unknown: keep the order pending and rely on the webhook
}

console.log(await waitForSettlement("ORDER-123"));
```
