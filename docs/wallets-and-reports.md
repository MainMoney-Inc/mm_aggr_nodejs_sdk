# Wallets, transactions and reports

## Purpose

Read balances, list your transactions and get aggregated reports.

## Prerequisites

Wallet and report reads: scope `MERCHANT_WALLET_READ` by name (the contract does not
map scopes to these endpoints; a missing scope answers 403). On MainMoney Rails each
call accepts `{ merchantAccount }` to read a seller's data
([details](mainmoney-rails.md#acting-on-behalf-of-a-seller)).

## Wallets and balances

`GET /manage/merchant-admin/wallets/` -> `client.wallets.list(query?, { merchantAccount? })`

Query: `country`, `currency`, `status`, `search`, `ordering`, `page`, `page_size`.
Paginated `{ count, next, previous, results }`; each wallet has `id`,
`merchant_id`, `merchant_name`, `currency`, `country`, `is_active`, `balance`,
`reserved_balance`, `available_balance`, `created_at`, `updated_at` (decimal
strings). A merchant has one wallet per currency and market: never add balances of
different currencies; group by `currency`.

## Transactions

`GET /manage/merchant-admin/transactions/{operation_type}/` ->
`client.transactions.list(operationType, query?, { merchantAccount? })` with
`operationType` one of `deposit`, `payout`, `refund`, `remittance`, `settlement`.

Query: `status`, `currency`, `country`, `provider_code`, `merchant_reference`,
`internal_reference`, `amount_min`, `amount_max`, `date_from`, `date_to`, `search`,
`ordering`, `page`, `page_size` (the contract gives no format for the dates).
Items: `id`, `operation_type`, `internal_reference`, `merchant_reference`,
`external_reference`, `provider_transaction_id`, `amount`, `currency`,
`provider_code`, `country`, `status`, `status_reason`, `created_at`,
`completed_at`.

## Reports

Query for both: `currency`, `date_from`, `date_to`, `operation_type`,
`provider_code`.

- `GET .../reports/charts/` -> `client.reports.charts(query?, options?)`:
  `{ volume_by_day: [{ date, currency, count, total_amount }] }`: one bucket per
  day and currency.
- `GET .../reports/summary/` -> `client.reports.summary(query?, options?)`:
  `{ totals_by_provider: [{ provider_code, currency, count, total_amount,
  success_count }], top_transactions: [{ operation_type, amount, currency,
  provider_code, merchant_reference, internal_reference, created_at }] }`.

Both are typed (`ReportsCharts`, `ReportsSummary`). Amounts of different
currencies are separate rows; do not total them.

## Errors

403 (scope or seller), 400 (bad filter). See [Errors](errors.md).

## Complete minimal example

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });

type Wallet = { currency: string; available_balance: string };
const wallets = (await client.wallets.list()) as { results: Wallet[] };
for (const w of wallets.results) console.log(w.currency, w.available_balance); // per currency

const deposits = await client.transactions.list("deposit", { status: "SUCCESS", page_size: 20 });
console.log(deposits);

const charts = await client.reports.charts({ currency: "USD", date_from: "2026-01-01", date_to: "2026-01-31" });
for (const day of charts.volume_by_day) console.log(day.date, day.currency, day.count, day.total_amount);
```
