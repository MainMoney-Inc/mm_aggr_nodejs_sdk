# MainMoney Rails (platforms and sellers)

## Purpose

MainMoney Rails lets a **platform** (marketplace, SaaS, aggregator) accept and move
money for its **sellers**. You create sellers, verify business sellers (KYB), run
transactions as a seller with `X-Merchant-Account`, optionally take an
application fee, and move funds between your wallet and a seller's wallet with
transfers.

## Prerequisites

- A platform merchant application. Scopes by name: `ACT_ON_BEHALF` (acting as a
  seller) and `MERCHANT_TRANSFER` (transfers); the contract does not state which
  scope guards each endpoint, a missing one answers 403.
- Sellers: a **LEGAL** seller is a business that must be verified (KYB) before it
  can transact; a **LOGIC** seller only needs wallets and can transact at once.
- A seller gets a wallet for each market of your account in its country.

## 1. Create a seller

```ts
const countries = await client.sellers.countries();          // GET /sellers/countries/
const kenya = countries.find((c) => c.code === "KE")!;       // { id, code, name }

const seller = await client.sellers.create({                 // POST /sellers/
  sub_type: "LEGAL",          // or "LOGIC"
  name: "Acme Shop",
  email: "owner@acme.example",
  country: kenya.id,          // the country id, not the code
  legal_name: "Acme Shop Ltd",
  phone_number: "254700000000",
  registration_number: "PVT-123",
  tax_id: "A001",
});
// seller.id is the value of X-Merchant-Account for this seller
```

Required: `sub_type`, `name`, `email`, `country`. A LEGAL seller starts with an empty
verification case. Seller fields: `id`, `name`, `legal_name`, `email`,
`sub_merchant_type`, `kyb_status`, `is_operational` (active and, for a business,
`APPROVED`), `created_at`.

Other calls: `sellers.list()` (`{ count, results }`), `sellers.get(id)` (adds
`country`, `notification_email`, `phone_number`, `registration_number`, `tax_id`
and `kyb`), `sellers.update(id, { name, legal_name, email, notification_email,
phone_number, registration_number, tax_id })` (the country is fixed at creation).

## 2. Verify a business (KYB)

`kyb.status` is `DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `EXPIRED`, or `null`
(no verification, LOGIC sellers).

```ts
await client.sellers.kyb(seller.id);                          // GET   /sellers/{id}/kyb/
await client.sellers.updateKyb(seller.id, {                   // PATCH /sellers/{id}/kyb/
  jurisdiction: "KE",
  ubos: [{ name: "Ada Owner", date_of_birth: "1985-04-12", nationality: "KE", ownership_pct: "100.00" }],
  // or, when there is no beneficial owner: no_ubo_reason: "..."
});
const started = await client.sellers.startKyb(seller.id);     // POST  /sellers/{id}/kyb/start/
// upload the documents (below), then:
await client.sellers.submitKyb(seller.id);                    // POST  /sellers/{id}/kyb/submit/  -> IN_REVIEW
```

- `updateKyb` is allowed while the case is `DRAFT` and before `startKyb`, or again
  after `REJECTED` / `EXPIRED`. A UBO has `name`, `ownership_pct` (required),
  `date_of_birth`, `nationality` (2 letters).
- `startKyb` needs the jurisdiction and either the owners or `no_ubo_reason`. From
  then on the declared data is frozen. It returns the case plus
  `capture_token { token, expires_at, upload_url }`. Call it again for a fresh token
  of the same session.
- **Document upload is not an SDK call.** POST each document to
  `capture_token.upload_url` as `multipart/form-data` with the header
  `X-Capture-Token: <capture_token.token>`. The contract does not list the form
  field names or accepted document types.
- `submitKyb` is refused (HTTP 400) naming the missing documents while one is
  missing; otherwise the status becomes `IN_REVIEW` (HTTP 202).
- Poll `sellers.kyb(id)` until `APPROVED` (the seller can transact), `REJECTED` or
  `EXPIRED` (correct the data with `updateKyb` and start again).

### Hosted onboarding link instead

```ts
const link = await client.sellers.createOnboardingLink(seller.id); // POST   .../onboarding-link/
console.log(link.url);   // send it to the business; shown once. { url, token, expires_at }
await client.sellers.revokeOnboardingLink(seller.id);              // DELETE .../onboarding-link/ -> { revoked: 1 }
```

The business declares its owners, uploads its documents and submits on a hosted
page. A new link replaces the previous one.

## Acting on behalf of a seller

Pass the seller `id` as `X-Merchant-Account`. The request runs as that seller: its
wallets, fees and limits apply and the record is attributed to it. The API answers
403 when the seller is unknown, is not yours or is not active.

Per call (last argument):

```ts
const opt = { merchantAccount: seller.id };
await client.deposits.create(payload, "key-1", opt);
await client.payouts.create(payload, "key-2", opt);
await client.refunds.create(payload, "key-3", opt);
await client.remittances.create(payload, "key-4", opt);
await client.status.check("deposit", "ORDER-1", opt);
await client.deposits.validatePayment({}, opt);
await client.paymentLinks.create({ reference: "L-1", amount: "10.00", currency: "USD" }, opt);
await client.wallets.list({}, opt);
await client.transactions.list("deposit", {}, opt);
await client.reports.summary({}, opt);
```

Or once for the client:

```ts
const sellerClient = new Client({ clientId, secret, test: true, merchantAccount: seller.id });
await sellerClient.deposits.create(payload, "key-1");                       // acts as the seller
await sellerClient.deposits.create(payload, "key-2", { merchantAccount: other }); // override
await sellerClient.wallets.list({}, { merchantAccount: null });            // your own wallets
```

The default applies only to the calls above: deposits (including
`validatePayment`), payouts (standard, business, business merchant account),
refunds, remittances, status, payment links, wallets, transactions and reports.
It is never sent on sellers, transfers, pricing, customers, countries, providers,
fees, amount limits, the card validate/payout paths (the contract lists the header
for none of these) or the token exchange. The contract also lists direct debits and
batch disbursements as supporting the header; the SDK has no methods for those
(they are not in the merchant contract).

If you handle several sellers on one process, prefer the per-call option (or one
client per seller, which keeps its own token).

### Application fee

On deposits and payouts made for a seller you can take a fee, when your account is
allowed to: `application_fee` (flat, in the request currency) **or**
`application_fee_percent` (percent of `amount`), never both; capped by the
platform's limit. Add these fields to the payload next to a `merchantAccount`.

```ts
await client.deposits.create(
  { provider_code: "MPESA_KE", reference: "S-1", amount: "100.00", currency: "KES",
    customer_phone: "254700000000", application_fee_percent: "2.5" },
  "S-1",
  { merchantAccount: seller.id },
);
```

The contract does not say where the fee is credited or the cap value.

## Transfers

Move funds between your (platform) wallet and a seller's. Not affected by
`X-Merchant-Account`; the seller is in the body.

```ts
const transfer = await client.transfers.create({   // POST /transactions/transfers/
  reference: "TR-2026-001",       // max 100 chars, unique per platform
  direction: "TO_SUB_MERCHANT",   // fund the seller; "FROM_SUB_MERCHANT" sweeps funds back
  sub_merchant_id: seller.id,
  amount: "250.00",
  currency: "USD",
  description: "Float for March payouts", // optional, max 255
});
const mine = await client.transfers.list({ sub_merchant_id: seller.id }); // GET, a plain array; also ?reference=
const one = await client.transfers.get(transfer.id);                      // GET /transactions/transfers/{id}/
```

A `Transfer` has `id`, `reference`, `direction`, `platform_merchant_id`,
`sub_merchant_id`, `amount`, `currency`, `description`, `channel` (`API` or
`BACKOFFICE`), `created_at`. Sending a reference again with the same details is a
replay and answers HTTP 200 instead of 201 (there is no `Idempotency-Key`); the SDK
returns the transfer in both cases. The contract does not say what happens when the
same reference is sent with different details or when a wallet lacks funds (expect
400; read `ApiException.errors`).

## Errors

| Status | Cause |
| --- | --- |
| 400 | invalid body, KYB data frozen or incomplete, `submit` with missing documents |
| 403 | missing scope; seller unknown / not yours / not active (for `X-Merchant-Account`) |

A LEGAL seller that is not `APPROVED` is not operational (`is_operational: false`);
the contract does not state the exact error returned when you act as it.

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

const [country] = await client.sellers.countries();
const seller = await client.sellers.create({
  sub_type: "LOGIC", // wallets only: can transact immediately
  name: "Street Vendor 1",
  email: "vendor1@example.com",
  country: country.id,
});

await client.transfers.create({
  reference: `FUND-${seller.id.slice(0, 8)}`,
  direction: "TO_SUB_MERCHANT",
  sub_merchant_id: seller.id,
  amount: "20.00",
  currency: "USD",
});

const deposit = await client.deposits.create(
  { provider_code: "VODACOM_MPESA_COD", reference: "VENDOR1-ORDER-1", amount: "5.00", currency: "USD", customer_phone: "243820000000" },
  "VENDOR1-ORDER-1",
  { merchantAccount: seller.id },
);
console.log(deposit);
console.log(await client.wallets.list({}, { merchantAccount: seller.id }));
```
