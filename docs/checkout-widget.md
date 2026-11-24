# Checkout widget proxy

## Purpose

The [JS/TS checkout widget](https://github.com/MainMoney-Inc/mm_aggr_js_sdk) runs in
the customer's browser but must never hold your API keys. It talks to a small
backend **you** own (the "merchant backend"), which forwards each call through this
SDK. The Express example in [`examples/express`](../examples/express) is a complete
implementation.

## Flow

1. Your page asks your backend for a checkout session: `POST /session` returns
   `merchantBackendUrl`, a short-lived `clientToken`, `pollUrl`, `pollHeaders`,
   and the amount and currency the server decided.
2. The widget calls `merchantBackendUrl/...` with `Authorization: Bearer <clientToken>`.
3. Your backend looks the token up, then calls the aggregator with the SDK.
4. The widget polls `pollUrl` for the status; webhooks update your order too.

The `clientToken` is your own session token, unrelated to the aggregator access
token. The API key and its token stay on the server.

## Routes the widget expects

Relative to `merchantBackendUrl`:

| Method | Path | SDK call |
| --- | --- | --- |
| GET | `/countries` | `client.countries.list()` |
| GET | `/providers?country=` | `client.providers.list(query)` |
| GET | `/match-provider?account_number=&get_lookup=true` | `client.customers.matchProvider(accountNumber, getLookup, operationType)` |
| GET | `/amount-limits` | `client.amountLimits.list(query)` |
| POST | `/fees/simulate` | `client.fees.simulate(body)` |
| GET | `/checkout-preferences` | `client.checkoutPreferences.get()` |
| POST | `/deposits` | `client.deposits.create(payload, key)` |
| POST | `/deposits/validate` | `client.deposits.validatePayment(body)` (the Express example does not implement this route) |
| POST | `/payouts` | `client.payouts.create(payload, key)` |
| GET | `pollUrl` | `client.status.check(operation, reference)` |

`GET /manage/general/checkout-preferences/` returns `primary_color`,
`secondary_color`, `accent_color`, `background_color`, `locale`, `logo`,
`fee_bearer` and `payment_methods` (the enabled checkout tabs, any of
`mobile_money`, `card`, `mainmoney`, in display order). It is written in the
backoffice.

## Rules for the proxy

- **Decide on the server.** Take `reference`, `amount` and `currency` from your own
  order or session, overriding what the browser sent (the example forces
  `reference` and, with `lockAmount`, `amount`).
- **Idempotency key per checkout session.** Derive it from the session token, not
  from the order or reference (see [Idempotency](idempotency.md)). The browser
  widget no longer sends an `Idempotency-Key` header by default, which is why your
  backend must create the key itself.
- **Authenticate each request** with the session token and answer 401 for an unknown
  one.
- **Do not reflect raw exceptions** to the browser; map `ApiException` to your own
  message (see [Errors](errors.md)). The example returns the error message for
  demonstration only.
- **Rate limit** the proxy.

## CORS

The browser calls your backend cross-origin, so the preflight (`OPTIONS`) must pass:

| Header | Value |
| --- | --- |
| `Access-Control-Allow-Origin` | your site origin (not `*`, because `Authorization` is sent) |
| `Access-Control-Allow-Methods` | `GET, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` |

List `Authorization` explicitly: `*` in `Access-Control-Allow-Headers` does not
cover it. Add `Idempotency-Key` only if you opt the widget into sending it
(`idempotencyHeader: true` in the JS SDK). A CORS error on `POST /deposits` while the
`GET` lookups work usually means the preflight rejects a header or the origin
(`http` vs `https`, `localhost` vs `127.0.0.1`, the port).

## Complete minimal example

```ts
import { createHash, randomBytes } from "node:crypto";
import cors from "cors";
import express from "express";
import { ApiException, Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });
const app = express();

app.use(
  cors({
    origin: ["https://shop.example"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

type Session = { reference: string; amount: string; currency: string };
const sessions = new Map<string, Session>(); // use a store with expiry in production

app.post("/session", (_req, res) => {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, { reference: `ORD-${randomBytes(4).toString("hex")}`, amount: "100.00", currency: "USD" });
  const base = "https://api.shop.example";
  res.json({
    merchantBackendUrl: `${base}/payments`,
    clientToken: token,
    pollUrl: `${base}/payments/status`,
    pollHeaders: { Authorization: `Bearer ${token}` },
  });
});

app.use("/payments", (req, res, next) => {
  const token = (req.header("authorization") ?? "").replace(/^Bearer /i, "");
  const session = sessions.get(token);
  if (!session) {
    res.status(401).json({ message: "Invalid checkout session" });
    return;
  }
  res.locals.session = session;
  res.locals.token = token;
  next();
});

app.get("/payments/countries", async (_req, res) => res.json(await client.countries.list()));

app.post("/payments/deposits", async (req, res) => {
  const session = res.locals.session as Session;
  const key = `mm-${createHash("sha256").update(String(res.locals.token)).digest("hex").slice(0, 32)}`;
  try {
    const result = await client.deposits.create(
      { ...req.body, reference: session.reference, amount: session.amount, currency: session.currency },
      key,
    );
    res.json(result);
  } catch (error) {
    if (error instanceof ApiException) {
      console.warn("deposit failed", error.statusCode, error.message, error.errors);
      res.status(error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 502).json({ message: "Payment could not be started" });
      return;
    }
    throw error;
  }
});

app.get("/payments/status", async (_req, res) => {
  const session = res.locals.session as Session;
  res.json(await client.status.check("deposit", session.reference));
});

app.listen(8004);
```
