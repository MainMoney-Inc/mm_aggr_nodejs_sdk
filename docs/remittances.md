# Remittances

## Purpose

Move value from your wallet to another merchant's wallet, across currencies. The
sender wallet is debited and the receiver wallet credited on success.

## Prerequisites

- Scope `REMITTANCE` (by name).
- Sufficient balance in the source currency.
- The receiving merchant's UUID.

## Request

`POST /transactions/remittances/` ->
`client.remittances.create(payload, idempotencyKey?, { merchantAccount? })`

| Field | Required | Meaning |
| --- | --- | --- |
| `provider_code` | yes | provider |
| `reference` | yes | your reference, unique per application |
| `receiver_merchant_id` | yes | UUID of the receiving merchant |
| `source_amount` | yes | decimal, at most 2 decimal places |
| `source_currency` | yes | ISO 4217 |
| `destination_amount` | yes | amount after conversion; the server checks it against the active exchange rate |
| `destination_currency` | yes | ISO 4217 |
| `destination_account` | yes | destination account or identifier |
| `destination_name` | no | |
| `purpose`, `purpose_code` | no | |
| `callback_url` | no | |
| `metadata` | no | |

Response (HTTP 201): `status`, `transaction_id`, `internal_reference`,
`external_reference`, `merchant_reference`, `timestamp`, `provider_reference`,
`message`, `error_code`, `error_message`, `data`, `processing_time_ms`.

How the exchange rate is chosen and how to obtain a valid `destination_amount` is
not described by the contract beyond "checked against the active exchange rate";
the call is rejected with 400 when it does not match. Keep `source_amount` and
`destination_amount` in their own currencies and never add them.

For moving funds between a platform and its sellers use
[transfers](mainmoney-rails.md#transfers) instead.

## Errors

400 (validation, duplicate reference, rate mismatch, balance), 403 (scope, seller),
409 (idempotency). See [Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const reference = "REMIT-2026-001";
const result = await client.remittances.create(
  {
    provider_code: "MPESA_KE",
    reference,
    receiver_merchant_id: "00000000-0000-4000-8000-000000000000",
    source_amount: "100.00",
    source_currency: "USD",
    destination_amount: "12900.00",
    destination_currency: "KES",
    destination_account: "254700000000",
    purpose: "Family support",
  },
  reference,
);
console.log(result);
```
