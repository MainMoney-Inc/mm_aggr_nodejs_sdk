# Deposits

## Purpose

Collect money from a customer (mobile money push, or a card flow) into your
merchant wallet. A deposit is credited to the wallet only after the provider
confirms it.

## Prerequisites

- Scope `DEPOSIT` (card flow: `CARD_DEPOSIT`), matched by name.
- A `provider_code` valid for the customer's country ([Countries and providers](countries-and-providers.md)),
  optionally resolved with [match provider](customers.md).
- Optional: check [limits](amount-limits.md) and [fees](fees.md) first.

## Create

`POST /transactions/deposits/` ->
`client.deposits.create(payload, idempotencyKey?, { merchantAccount? })`

| Field | Required | Meaning |
| --- | --- | --- |
| `provider_code` | yes | provider |
| `reference` | yes | your reference, unique per application |
| `amount` | yes | decimal string, `"100.50"` |
| `currency` | yes | ISO 4217 code of the order |
| `customer_phone` | yes | E.164 style digits, for example `243820000000` |
| `payment_currency` | no | currency the customer pays in, when different (see [Fees](fees.md)); HTTP 400 `no_quote` when no rate exists |
| `customer_name` | no | |
| `customer_email` | no | a receipt is sent there when the deposit succeeds |
| `fees` | no | your own fee on top of `amount`; only for accounts the backoffice enabled, otherwise 400 |
| `fee_bearer` | no | `MERCHANT` or `CUSTOMER` |
| `application_fee`, `application_fee_percent` | no | platforms only, with `X-Merchant-Account`; not together (see [MainMoney Rails](mainmoney-rails.md)) |
| `profile_reference` | no | for providers that require a deposit profile |
| `callback_url` | no | URL for status updates |
| `metadata` | no | object stored with the transaction |

Response (HTTP 202; the SDK returns `response_data`):

```json
{
  "status": "PENDING",
  "transaction_id": "...",
  "internal_reference": "...",
  "external_reference": "...",
  "merchant_reference": "ORDER-123",
  "timestamp": "2026-01-01T12:00:00Z",
  "provider_reference": null,
  "message": "",
  "error_code": null,
  "error_message": null,
  "data": {},
  "processing_time_ms": 412
}
```

`status` is `SUCCESS`, `PENDING`, `FAILED`, etc. The usual outcome is `PENDING`:
the customer approves on their phone, then the webhook arrives or you
[check the status](status.md). When the customer paid in another currency, status
and webhooks report the charged `amount`/`currency` plus `original_amount` and
`original_currency`.

A provider failure is never reported as final: you get `PENDING` and the settlement
comes later. Failures before the provider is called (validation, limits) are final
`FAILED`.

## Validate payment (authenticator token)

`POST /transactions/deposits/validate-payment/` ->
`client.deposits.validatePayment(payload?, { merchantAccount? })`

Confirms a payment with an authenticator token (the contract describes it as the
EcoBank DIRECT_DEBIT_VERIFYPAYMENT confirmation). Response: same shape as a
deposit. The contract publishes no request body fields for it; send what your
provider integration requires.

Card variant: `POST /transactions/card-deposits/validate-payment/` ->
`client.deposits.validateCardPayment(payload?)`. The contract lists no
`X-Merchant-Account` or `Idempotency-Key` on this path, so the SDK sends none, and
it also publishes no request body fields.

## Errors

| Status | Cause |
| --- | --- |
| 400 | invalid field, duplicate `reference`, limit, `fees` not allowed, `no_quote` |
| 403 | missing scope, or invalid seller with `X-Merchant-Account` |
| 409 | `Idempotency-Key` reused with another body, or still in progress |

See [Errors](errors.md) and [Idempotency](idempotency.md).

## Complete minimal example

```ts
import { ApiException, Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const orderId = "ORDER-123";
try {
  const deposit = (await client.deposits.create(
    {
      provider_code: "VODACOM_MPESA_COD",
      reference: orderId,
      amount: "100.00",
      currency: "USD",
      customer_phone: "243820000000",
      customer_email: "ada@example.com",
    },
    `checkout-session-${orderId}`,
  )) as { status: string; internal_reference: string };
  console.log(deposit.status, deposit.internal_reference); // usually PENDING: wait for the webhook
} catch (error) {
  if (error instanceof ApiException) console.error(error.statusCode, error.message, error.errors);
  else throw error;
}
```
