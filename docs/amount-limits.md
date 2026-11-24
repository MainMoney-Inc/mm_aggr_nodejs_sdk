# Amount limits

## Purpose

Read the configured minimum and maximum amounts per provider, operation type and
currency so you can validate an amount before creating a transaction.

## Prerequisites

Read access to general data (see [Authentication](authentication.md)).

## Request

`GET /manage/general/amount-limits/` -> `client.amountLimits.list(query?)`

Query: `currency`, `financial_entity_code`, `operation_type`, `search`,
`ordering`, `page`, `page_size`.

```json
{
  "count": 1, "next": null, "previous": null,
  "results": [
    {
      "id": "uuid",
      "financial_entity_code": "VODACOM_MPESA_COD",
      "operation_type": "DEPOSIT",
      "currency": "USD",
      "amount_min": "1.00",
      "amount_max": "5000.00",
      "effective_from": null,
      "effective_until": null,
      "is_active": true,
      "description": ""
    }
  ]
}
```

`amount_min`, `amount_max`, `operation_type` and the effective dates may be `null`.
Limits are per currency; compare an amount only with a limit of the same currency.
Failing a limit is a final `FAILED` before the provider is called. The contract
allows caching (see [Countries and providers](countries-and-providers.md)).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

type Limit = { amount_min: string | null; amount_max: string | null; currency: string };
const page = (await client.amountLimits.list({
  financial_entity_code: "VODACOM_MPESA_COD",
  operation_type: "DEPOSIT",
  currency: "USD",
})) as { results: Limit[] };

const amount = 100; // same currency as the limit (USD)
const ok = page.results.every(
  (l) => (l.amount_min === null || amount >= Number(l.amount_min)) && (l.amount_max === null || amount <= Number(l.amount_max)),
);
console.log(ok ? "within limits" : "out of limits");
```
