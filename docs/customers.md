# Match provider, customer lookup and KYC

## Purpose

- **Match provider**: from an account or phone number, find which provider it
  belongs to (for example `243840000000` returns the Orange DRC provider).
- **Lookup**: confirm an account exists and is active, and get the holder name.
- **KYC**: a richer identity profile for an account or phone number.

## Prerequisites

Scopes `CUSTOMER_LOOKUP` (lookup, match) and `USER_KYC` (KYC) by name; the contract
does not map them explicitly. A missing scope answers 403. None of these calls
takes `X-Merchant-Account`.

## Match provider

`GET /transactions/customers/match-provider/` ->
`client.customers.matchProvider(accountNumber, getLookup = false, operationType?)`

Query: `account_number` (required), `get_lookup` (also return account information
when the provider supports it), `operation_type` (restrict to entities this
merchant can route that operation through). Only providers in your allowed
countries are returned. Send phone numbers as `<dial code><national number>`
(`243820000000`).

The response is a `CustomerLookupResponse` (below). The contract does not describe
the field that carries the matched provider code; inspect the live response (the
widget reads `lookup_data.name` when present).

## Lookup

`POST /transactions/customers/lookup/` -> `client.customers.lookup(payload)`

```json
{ "provider_code": "VODACOM_MPESA_COD", "account_number": "243820000000", "account_type": "mobile_money" }
```

`provider_code` and `account_number` are required; `account_type` (for example
`bank`, `mobile_money`) is optional.

```json
{
  "account_number": "243820000000",
  "is_active": true,
  "name": "Ada Lovelace",
  "account_type": "mobile_money",
  "additional_info": {}
}
```

## KYC

`POST /transactions/customers/kyc/` -> `client.customers.kyc(payload)`

Request: `provider_code`, `account_number` (required), `account_type`. Response
fields: `account_number`, `is_active`, `name`, `account_type`, `first_name`,
`last_name`, `dob`, `id_number`, `nationality`, `grade`, `barred`,
`lookup_supported` (default true), `error_code`, `message`, `additional_info`.
Which fields are filled depends on the provider; unsupported lookups set
`lookup_supported: false`.

## Errors

400 for invalid input, 401 handled by the SDK, 403 for a missing scope. See
[Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const match = await client.customers.matchProvider("243820000000", true, "DEPOSIT");
console.log(match);

const holder = await client.customers.lookup({
  provider_code: "VODACOM_MPESA_COD",
  account_number: "243820000000",
  account_type: "mobile_money",
});
console.log(holder);
```
