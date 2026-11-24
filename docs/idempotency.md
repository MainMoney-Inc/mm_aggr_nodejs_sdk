# Idempotency

## Purpose

Make creates safe to retry without paying or paying out twice.

## Two mechanisms

1. `reference` (`merchant_reference` in responses) is unique per merchant
   application. Reusing one answers a validation error, whatever the earlier
   outcome. A deposit that failed keeps its reference for good.
2. Optional `Idempotency-Key` header (max 255 characters), on creates only:
   deposits, payouts (all variants), remittances and refunds.

With the header, per merchant application:

| Situation | Result |
| --- | --- |
| same key, same JSON body | the first HTTP status and body are replayed; the provider is not called again |
| same key, different body | HTTP 409 |
| same key while the first request is still in progress | HTTP 409 |

There is no `Idempotency-Key` on GETs, token exchange, status checks, lookups, fee
simulation, payment links, transfers or sellers. Payment links and transfers rely
on a unique `reference` (a transfer re-sent with the same reference and details is
a replay).

## In the SDK

The key is the second argument of every create:

```ts
await client.deposits.create(payload, "key-123");
await client.payouts.create(payload, "key-456");
await client.refunds.create(payload, "key-789");
await client.remittances.create(payload, "key-abc");
// with a seller: third argument
await client.deposits.create(payload, "key-123", { merchantAccount: sellerId });
```

Omit it, or pass `null` / `""`, to send no header. The SDK never generates keys.

## Rules

- One key identifies one attempt, not one order. When the body changes (the
  customer fixes a phone number, picks another currency) use a new key.
- A failed deposit needs a new `reference` too, for example `ORDER-12-r1`.
- Retry the same create (same body) with the same key after a timeout or 5xx.
- For a checkout, derive the key from the checkout session (one per page load or
  retry), not from the cart, order or reference: a refresh starts a fresh attempt, a
  double submit replays the first answer.
- Make webhook handlers idempotent too, on `webhook_event_id` or
  `merchant_reference`.

## Complete minimal example

```ts
import { createHash } from "node:crypto";
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: "...", secret: "...", test: true });

const sessionToken = "per-checkout-session-secret";
const key = `mm-${createHash("sha256").update(sessionToken).digest("hex").slice(0, 32)}`;

const body = {
  provider_code: "VODACOM_MPESA_COD",
  reference: "ORDER-123",
  amount: "100.00",
  currency: "USD",
  customer_phone: "243820000000",
};

const first = await client.deposits.create(body, key);
const replay = await client.deposits.create(body, key); // same answer, provider not called again
```
