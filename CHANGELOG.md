# Changelog

## Unreleased

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
