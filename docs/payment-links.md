# Payment links

A payment link is a hosted page you create through the API. You send the link's
`url` to a customer (email, SMS, chat, QR code) and they pay there by card or
mobile money. The amount is fixed when you create the link; the customer cannot
change it. The API key must have the `PAYMENT_LINK` scope.

```ts
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({
  clientId: process.env.MM_CLIENT_ID ?? "",
  secret: process.env.MM_API_SECRET ?? "",
  test: true,
});
```

## Create

```ts
const link = await client.paymentLinks.create({
  reference: "INV-2026-0042",       // your unique reference (max 100 chars)
  amount: "25.00",                   // decimal string
  currency: "USD",
  title: "Invoice 42",               // optional, shown to the customer
  description: "Consulting, March",  // optional
  methods: ["card", "mobile_money"], // optional; omit to offer every available method
  expires_at: "2026-12-31T23:59:59Z", // optional; null or omitted = no expiry
  single_use: true,                  // optional; API default is true
  redirect_url: "https://shop.example.com/thanks", // optional
  customer_name: "Ada Lovelace",     // optional
  customer_email: "ada@example.com", // optional
  customer_phone: "243820000000",    // optional
  metadata: { invoice_id: 42 },      // optional
});

console.log(link.id, link.status); // status starts as "ACTIVE"
console.log(link.url);             // the public URL the customer pays at
```

`url` is the only thing the customer needs. Share it as is; do not rebuild it.
The create endpoint does not list an `Idempotency-Key` header in the API
contract, so the SDK does not send one. Use a unique `reference` per link.

- `expires_at`: the link stops accepting payments after this time and its status
  becomes `EXPIRED`.
- `single_use`: when `true` (the API default) the link closes after the first
  successful payment (status `PAID`). Set `false` for a link that can be paid
  several times.
- `redirect_url`: where the customer is sent after paying.
- `methods`: a subset of `card` and `mobile_money`. `effective_methods` on the
  response is what the customer can use right now.

## List, get, cancel

```ts
const page = await client.paymentLinks.list({ status: "ACTIVE", page: 1 });
for (const item of page.results) {
  console.log(item.reference, item.status, item.url);
}

const one = await client.paymentLinks.get(link.id);

const cancelled = await client.paymentLinks.cancel(link.id); // status "CANCELLED"
```

`list` returns newest first as `{ count, next, previous, results }` and also
accepts `ordering`, `page`, `page_size` and `search`. Only an active link can be
cancelled; a paid link cannot.

## Statuses and after payment

`status` is one of `ACTIVE`, `PAID`, `EXPIRED`, `CANCELLED`. When the customer
pays, the link gets `paid_at` and (for single use) the status `PAID`. Payments
arrive as normal deposits and webhooks, so verify webhooks with
`client.webhooks.verify(rawBody, signature, secret)` and use `get` to read the
link's current status. Match payments to links with your `reference`.

## Acting on behalf of a seller

Platforms using MainMoney Rails pass the seller's account id as
`merchantAccount`; the SDK sends it as the `X-Merchant-Account` header. The link
is then created for, and attributed to, that seller (`account_id` on the
response). Every method accepts it as the last argument:

```ts
const link = await client.paymentLinks.create(
  { reference: "SELLER-INV-1", amount: "10.00", currency: "USD" },
  { merchantAccount: "<seller account id>" },
);
const links = await client.paymentLinks.list({}, { merchantAccount: "<seller account id>" });
await client.paymentLinks.get(link.id, { merchantAccount: "<seller account id>" });
await client.paymentLinks.cancel(link.id, { merchantAccount: "<seller account id>" });
```

Set `merchantAccount` once on the client (`new Client({ ..., merchantAccount })`) to
make it the default for every supporting call; a per-call value overrides it and
`{ merchantAccount: null }` sends none. The API answers 403 when the seller is
unknown, is not yours or is not active. See [MainMoney Rails](mainmoney-rails.md).

## Errors

Failures throw `ApiException` (`statusCode` and the decoded body are available):

```ts
import { ApiException } from "@mainmoneyapp/sdk";

try {
  await client.paymentLinks.create({ reference: "INV-1", amount: "25.00", currency: "USD" });
} catch (error) {
  if (error instanceof ApiException) {
    // 400: validation (bad amount, currency, expires_at, methods ...)
    // 409: the contract lists no error codes for payment links; in practice a reused reference or the
    //      link is in a state that does not allow the action (such as cancelling a paid link)
    // 403: missing PAYMENT_LINK scope, or an invalid X-Merchant-Account seller
  }
  throw error;
}
```
