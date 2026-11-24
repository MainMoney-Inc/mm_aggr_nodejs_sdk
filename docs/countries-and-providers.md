# Countries and providers

## Purpose

Find out where this merchant may operate and which providers (financial entities)
can be used, before creating a transaction. Both lists are read-only; allowing or
disallowing countries is done in the backoffice.

## Prerequisites

An API key that can read general data (scope list in [Authentication](authentication.md);
the contract does not name the required scope, a missing one answers 403).

## Countries

`GET /manage/general/countries/` -> `client.countries.list(query?)`

Returns the effective allow-list: the admin-managed allow-list (or all active
countries when none is set), minus disallowed ones, and only countries with at
least one active financial entity. Send operations only for these codes.

Query: `search`, `ordering`, `page`, `page_size`.

```json
{
  "count": 1, "next": null, "previous": null,
  "results": [
    { "code": "CD", "name": "DR Congo", "iso3_code": "COD", "phone_code": "243", "flag": "https://..." }
  ]
}
```

`flag` is a URL or `null`.

## Providers

`GET /manage/general/financial-entities/` -> `client.providers.list(query?)`

Filtered to the effective countries. Query: `country`, `entity_type`,
`operation_type` (only entities this merchant can execute that operation on),
`search`, `ordering`, `page`, `page_size`.

```json
{
  "count": 1, "next": null, "previous": null,
  "results": [
    {
      "code": "VODACOM_MPESA_COD",
      "name": "Vodacom M-Pesa",
      "entity_type": "...",
      "country_code": "CD",
      "currency_code": "USD",
      "accepted_currencies": ["USD", "CDF"],
      "logo": null,
      "is_active": true
    }
  ]
}
```

Use `code` as `provider_code` on every transaction. `accepted_currencies` are the
currencies a customer may pay in (see `payment_currency` in [Deposits](deposits.md)).
The contract does not enumerate `entity_type` values.

## Caching

The contract says integrations may cache countries, providers, amount limits and
checkout preferences (for example 24 hours) and should renew them when
credentials or configuration change.

## Errors

403 for a missing scope; 401 handling is automatic. See [Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const countries = (await client.countries.list({ page_size: 100 })) as { results: { code: string }[] };
const first = countries.results[0]?.code;

const providers = (await client.providers.list({ country: first, operation_type: "DEPOSIT" })) as {
  results: { code: string; name: string; accepted_currencies: string[] }[];
};
for (const p of providers.results) console.log(p.code, p.name, p.accepted_currencies.join(","));
```
