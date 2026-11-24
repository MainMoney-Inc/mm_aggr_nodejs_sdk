# Changelog

## Unreleased

## 0.2.1

- Added `client.sellers` (list, countries, create, get, update, `kyb`, `updateKyb`, `startKyb`, `submitKyb`, `createOnboardingLink`, `revokeOnboardingLink`), `client.transfers` (create, list, get), `client.pricing.get` and `client.reports` (`charts`, `summary`) for MainMoney Rails and merchant reporting, with exported types.
- Added `deposits.validateCardPayment` (`/transactions/card-deposits/validate-payment/`) and `payouts.createCardBusinessMerchantAccount` (`/transactions/card-payouts/business/merchant-account/`).
- `X-Merchant-Account` (act on behalf of a seller) is now supported by deposits, `validatePayment`, all payouts, refunds, remittances, status, transactions, wallets and reports, via a trailing `{ merchantAccount }` option (after `idempotencyKey` on creates), and client-wide via `new Client({ merchantAccount })`. A per-call value overrides the default and `null` sends none. Existing calls are unchanged.
- `client.status.check` and `client.transactions.list` URL-encode the operation type.
- Documentation: a README quick start plus per-flow guides under `docs/` (authentication, countries and providers, customers, limits, fees, pricing, deposits, payouts, remittances, refunds, status, webhooks, idempotency, errors, payment links, wallets and reports, MainMoney Rails, checkout widget proxy).
- Express example: CORS allows `Content-Type` and `Authorization`; the webhook handler verifies the signature over the raw body.

## 0.2.0

- Added `client.paymentLinks` (`create`, `list`, `get`, `cancel`) for the Payment Links API; requires an API key with the `PAYMENT_LINK` scope.
- Payment link calls accept `{ merchantAccount }` to send `X-Merchant-Account` and act on behalf of a seller.
- Exported the `PaymentLink*` types. `VERSION` now matches the package version.

## 0.1.3

- Security: base URI and path trimming run in linear time (CodeQL `js/polynomial-redos`).
- Security: the Express example is rate limited (`RATE_LIMIT_PER_MINUTE`, default 300).
- Security: dependency updates (vitest 4, vite, esbuild, tinypool, source-map-js).
- Workflows declare least-privilege `permissions: contents: read` (CodeQL).
- README and Express example: derive the `Idempotency-Key` from the checkout session, not the reference.

## 0.1.1

- Relicensed under the MIT License.
- Package scope is now `@mainmoneyapp` (`@mainmoneyapp/sdk`).
- First release published to npm.
