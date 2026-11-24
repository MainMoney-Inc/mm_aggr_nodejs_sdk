# Payouts

## Purpose

Send money from your merchant wallet to a mobile money number, bank account or a
provider merchant account. The wallet is debited before the provider call.

## Prerequisites

- Scope `PAYOUT`; business payouts need `BUSINESS_PAYOUT` (stated in the contract);
  card payouts `CARD_PAYOUT` by name.
- Enough available balance ([wallets](wallets-and-reports.md)); the balance is
  checked first.
- A `provider_code` that supports the operation (`providers.list({ operation_type })`).

## Variants

| Method | Path | Use |
| --- | --- | --- |
| `payouts.create` | `/transactions/payouts/` | standard payout |
| `payouts.createBusiness` | `/transactions/payouts/business/` | business payout to a beneficiary **phone number** (provider B2C path); `purpose` is mandatory |
| `payouts.createBusinessMerchantAccount` | `/transactions/payouts/business/merchant-account/` | business payout to a provider **merchant account (shortcode)** (B2B path); `destination_account` must be the shortcode, not a phone; `purpose` is mandatory |
| `payouts.createCardBusinessMerchantAccount` | `/transactions/card-payouts/business/merchant-account/` | card path variant; the contract describes it like the business merchant-account payout but lists no `Idempotency-Key` or `X-Merchant-Account` for it, so the SDK sends neither |

The first three: `create(payload, idempotencyKey?, { merchantAccount? })`.

## Request (`PayoutRequest`)

| Field | Required | Meaning |
| --- | --- | --- |
| `provider_code` | yes | provider |
| `reference` | yes | your reference, unique per application |
| `amount` | yes | decimal string |
| `currency` | yes | ISO 4217 |
| `destination_account` | yes | account number, phone or identifier |
| `destination_name` | no | account holder name |
| `purpose` | no (mandatory on business variants) | human readable purpose |
| `purpose_code` | no | standardized purpose code |
| `callback_url` | no | |
| `fee_bearer` | no | `MERCHANT`: debited `amount` + fees; `CUSTOMER`: recipient gets `amount` minus fees |
| `application_fee` / `application_fee_percent` | no | platforms only; not together |
| `metadata` | no | object |

Payouts never accept the merchant `fees` field. Response (`PayoutResponse`, HTTP
201): same shape as a deposit response (`status`, `transaction_id`,
`internal_reference`, `external_reference`, `merchant_reference`, `timestamp`,
`provider_reference`, `message`, `error_code`, `error_message`, `data`,
`processing_time_ms`).

## Outcomes

A provider failure is never reported as final: the call answers `PENDING` and a
[status check](status.md) or the webhook settles it. If a payout is confirmed
failed, the debit and the fees are returned together; if the provider paid, both
stay. Failures before the provider call (validation, limits, insufficient balance)
are final `FAILED`.

## Errors

400 (validation, duplicate reference, balance, fees taking the whole amount with
`CUSTOMER`), 403 (scope, seller), 409 (idempotency). See [Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const reference = "PAYOUT-2026-001";
const payout = await client.payouts.createBusiness(
  {
    provider_code: "MPESA_KE",
    reference,
    amount: "50.00",
    currency: "KES",
    destination_account: "254700000000",
    destination_name: "Ada Lovelace",
    purpose: "Supplier payment",
  },
  reference,
);
console.log(payout);

// Business payout to a provider shortcode
await client.payouts.createBusinessMerchantAccount(
  {
    provider_code: "MPESA_KE",
    reference: "PAYOUT-2026-002",
    amount: "500.00",
    currency: "KES",
    destination_account: "123456", // the provider merchant shortcode
    purpose: "Settlement",
  },
  "PAYOUT-2026-002",
);
```
