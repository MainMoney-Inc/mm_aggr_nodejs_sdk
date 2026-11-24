# Fees simulation

## Purpose

Show the customer or yourself what a deposit or payout costs before creating it:
the fee breakdown, what the merchant wallet receives or loses, and the checkout fee
box. Also covers the merchant's own `fees`, who pays (`fee_bearer`) and paying in
another currency (`payment_currency`).

## Prerequisites

Read access to general data (see [Authentication](authentication.md)). No
transaction is created and there is no `Idempotency-Key`.

## Fee structure

`GET /manage/general/fees/` -> `client.fees.list(query?)`. Query: `country`,
`currency`, `financial_entity_code`, `search`, `ordering`, `page`, `page_size`.
Each result is a pricing rule: `id`, `scope`, `operation_type`, `fee_type`,
`amount_type`, `value`, `composition_mode`, `parent_rule_id`, `currency`,
`financial_entity_code`, `financial_entity_country`, `financial_entity_currency`,
`api_provider_code`, `effective_from`, `effective_until`, `is_active`, `name`,
`description`. For the price per operation type use [Pricing](pricing.md).

## Simulate

`POST /manage/general/fees/simulate/` -> `client.fees.simulate(payload)`

| Field | Required | Meaning |
| --- | --- | --- |
| `provider_code` | yes | provider code |
| `operation_type` | yes | `DEPOSIT`, `PAYOUT`, `BUSINESS_PAYOUT`, `REMITTANCE`, `REFUND`, ... (the contract enumerates 25 values) |
| `amount` | yes | decimal string, the goods amount |
| `currency` | no | currency of `amount` |
| `payment_currency` | no | currency the customer pays in, when different |
| `fees` | no | your own merchant fee on top of `amount` (deposits, only if your account is allowed to add fees) |
| `fee_bearer` | no | `MERCHANT` or `CUSTOMER`, overriding the account default |

Response fields: `provider_code`, `operation_type`, `amount`, `currency`,
`provider_fee`, `our_fee`, `merchant_additional_fee`, `promotion_discount`,
`total_merchant_fee`, `net_amount`, `fee_bearer`, `merchant_fee`, `base_amount`,
`provider_fee_declarative`, `charged_fees`, `provider_amount` (what the provider
processes), `merchant_wallet_effect` (negative for payouts), the checkout fee box
`merchant_receives`, `processing_fee`, `total_to_pay`, the rule ids
(`provider_fee_rule_id`, `our_fee_rule_id`, `promotion_rule_id`,
`merchant_additional_rule_ids`) and, only with `payment_currency`, `quote`.

## Who pays what

`amount` is always the goods amount; your own fee is the separate `fees` field,
accepted on deposits only. Platform fees are computed on `B = amount + fees`
(deposit) or `B = amount` (payout); `C` is the charged total. Payouts never accept
`fees`.

| Operation | `fee_bearer` | Provider processes | Merchant wallet |
| --- | --- | --- | --- |
| Deposit | `MERCHANT` | customer pays `B` | credited `B`, fees `C` debited, nets `B - C` |
| Deposit | `CUSTOMER` | customer pays `B + C` | credited `B + C`, fees `C` debited, nets `B` |
| Payout | `MERCHANT` | recipient gets `amount` | debited `amount + C` before the provider call |
| Payout | `CUSTOMER` | recipient gets `amount - C` | debited `amount` |

Example: `amount` 100, `fees` 1, platform fees 3 on 101. `CUSTOMER`: the customer
pays 104 and the merchant nets 101. `MERCHANT`: the customer pays 101 and the
merchant nets 98. A payout whose fees would take the whole amount with `CUSTOMER`
is rejected. `GET /manage/general/checkout-preferences/` returns the merchant's
default `fee_bearer`.

## Paying in another currency

With `payment_currency` the whole simulation (amount, fees, fee box) is expressed
in that currency and carries:

```json
{ "quote": { "from_currency": "USD", "to_currency": "CDF", "rate": "2800.000000", "source": "...", "converted_amount": "280000.00" } }
```

The aggregator converts with the active exchange rate (sell side, conversion fee
included, rounded up). When no active rate links the two currencies the call, and a
deposit, answers HTTP 400 with `errors.payment_currency: ["no_quote: ..."]`: ask the
customer to pay in the order currency. `payment_currency` must be one of the
provider's `accepted_currencies`. Never add or compare the original and converted
amounts; they are different currencies tied by the quote.

## Complete minimal example

```ts
import { ApiException, Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

try {
  const plan = (await client.fees.simulate({
    provider_code: "VODACOM_MPESA_COD",
    operation_type: "DEPOSIT",
    amount: "100.00",
    currency: "USD",
    payment_currency: "CDF",
    fee_bearer: "CUSTOMER",
  })) as { total_to_pay: string | null; merchant_receives: string | null; currency: string; quote?: { rate: string } };
  console.log(`customer pays ${plan.total_to_pay} ${plan.currency}, you receive ${plan.merchant_receives}`);
} catch (error) {
  if (error instanceof ApiException && error.statusCode === 400) {
    console.warn("No quote or invalid input:", error.errors); // fall back to the order currency
  } else {
    throw error;
  }
}
```
