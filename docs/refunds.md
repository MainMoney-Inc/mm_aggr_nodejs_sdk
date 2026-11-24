# Refunds

## Purpose

Reverse a previous deposit. The refund amount is handled against the merchant
wallet per the aggregator's rules; the contract only says it is "credited back to
the merchant's wallet upon success" and does not describe partial-refund limits.

## Prerequisites

- Scope `REFUND` (by name).
- The `reference` of the original deposit.

## Request

`POST /transactions/refunds/` ->
`client.refunds.create(payload, idempotencyKey?, { merchantAccount? })`

| Field | Required | Meaning |
| --- | --- | --- |
| `provider_code` | yes | provider |
| `reference` | yes | a new unique reference for the refund |
| `original_transaction_id` | yes | merchant reference of the deposit being refunded |
| `amount` | yes | decimal string |
| `currency` | yes | ISO 4217 |
| `customer_phone` | yes | customer phone, E.164 style |
| `reason` | yes | human readable reason |
| `reason_code` | no | standardized code |
| `callback_url` | no | |
| `metadata` | no | |

Response (HTTP 201): `status`, `transaction_id`, `internal_reference`,
`external_reference`, `merchant_reference`, `timestamp`, `provider_reference`,
`message`, `error_code`, `error_message`, `data`, `processing_time_ms`. Follow the
outcome with a [status check](status.md) (`"refund"`) or the `REFUND` webhook.

## Errors

400 (validation, duplicate reference), 403, 409. See [Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const refundRef = "RF-ORDER-123";
const refund = await client.refunds.create(
  {
    provider_code: "VODACOM_MPESA_COD",
    reference: refundRef,
    original_transaction_id: "ORDER-123",
    amount: "100.00",
    currency: "USD",
    customer_phone: "243820000000",
    reason: "Customer returned the goods",
  },
  refundRef,
);
console.log(refund);
```
