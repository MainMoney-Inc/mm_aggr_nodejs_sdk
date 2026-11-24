# Node.js SDK guides

Install and first call: [../README.md](../README.md). Contributing:
[../CONTRIBUTING.md](../CONTRIBUTING.md).

Every guide states its purpose, prerequisites, request and response with the field
names of the pinned merchant API contract, error cases and a complete minimal
example. Where the contract is silent the guide says so. Sample values (references,
ids, amounts) are illustrative.

## Basics

| Guide | Covers |
| --- | --- |
| [Authentication](authentication.md) | `client_id` / `secret`, token exchange, caching, API key scopes |
| [Errors and exception handling](errors.md) | envelopes, `ApiException`, retries, safe messages |
| [Idempotency](idempotency.md) | `reference` and `Idempotency-Key` |

## Reference data (read-only)

| Guide | Covers |
| --- | --- |
| [Countries and providers](countries-and-providers.md) | allow-list, financial entities, caching |
| [Match provider, customer lookup and KYC](customers.md) | `matchProvider`, `lookup`, `kyc` |
| [Amount limits](amount-limits.md) | `amountLimits.list` |
| [Fees simulation](fees.md) | `fees.list`, `fees.simulate`, merchant fee, `payment_currency` quote |
| [Pricing](pricing.md) | `pricing.get` |

## Money movement

| Guide | Covers |
| --- | --- |
| [Deposits](deposits.md) | mobile money, `validatePayment`, card `validateCardPayment` |
| [Payouts](payouts.md) | standard, business (phone), business merchant account, card |
| [Remittances](remittances.md) | wallet to wallet across merchants |
| [Refunds](refunds.md) | reversing a deposit |
| [Status check and polling](status.md) | `status.check` |
| [Webhooks](webhooks.md) | signature verification, payload, retries |
| [Payment links](payment-links.md) | hosted payment pages |

## Account data

| Guide | Covers |
| --- | --- |
| [Wallets, transactions and reports](wallets-and-reports.md) | balances, listings, charts, summary |

## MainMoney Rails (platforms)

| Guide | Covers |
| --- | --- |
| [MainMoney Rails](mainmoney-rails.md) | sellers, KYB, onboarding link, `X-Merchant-Account`, transfers |

## Browser checkout

| Guide | Covers |
| --- | --- |
| [Checkout widget proxy](checkout-widget.md) | the Express example, CORS, session tokens |
