# Pricing

## Purpose

Read the merchant-visible price per operation type (provider fee, our fee,
additional fee, promotion discount, total), as shown on the portal's Pricing card.
No transaction is created.

## Prerequisites

Read access to general data (see [Authentication](authentication.md)).

## Request

`GET /manage/general/pricing/` -> `client.pricing.get(query?)`

| Query | Meaning |
| --- | --- |
| `financial_entity_code` | scope to one entity; defaults to the application's entity |
| `operation_type` | one operation type; defaults to all merchant-facing types |

The price is resolved from your application scope and the entity's current
provider. A live provider tariff override is applied for BIF/USD when the execution
adapter implements it.

```json
{
  "items": [
    {
      "operation_type": "DEPOSIT",
      "provider_fee": "1.0000",
      "provider_fee_declarative": false,
      "our_fee": "0.5000",
      "merchant_additional_fee": "0.0000",
      "promotion_discount": "0.0000",
      "total_merchant_fee": "1.5000",
      "charged_fees": "1.5000",
      "provider_fee_rule_id": null,
      "our_fee_rule_id": null,
      "promotion_rule_id": null,
      "merchant_additional_rule_ids": []
    }
  ]
}
```

The contract does not state the currency or the base amount these fee values refer
to; for a concrete amount use [Fees simulation](fees.md).

## Errors

403 for a missing scope; see [Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const { items } = await client.pricing.get({ financial_entity_code: "VODACOM_MPESA_COD" });
for (const item of items) {
  console.log(item.operation_type, "total fee", item.total_merchant_fee);
}
```
