# Webhooks

## Purpose

The aggregator notifies your server when a transaction changes state. You receive
webhooks; there is no merchant API to register or test them. The URL and secret
are configured in the aggregator admin (`Merchant.webhook_url`, optional webhook
rules). Webhooks are verified on the server only, never in a browser.

## Prerequisites

- A public HTTPS URL configured by MainMoney/your admin, and the webhook secret.
  Localhost is not reachable; use a tunnel, or poll with [status checks](status.md).

## Request you receive

`POST` to your URL with:

| Header | Meaning |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `MM-Aggregator-Webhook/1.0` |
| `X-Webhook-Event-ID` | event UUID |
| `X-Webhook-Provider` | financial entity code |
| `X-Webhook-Type` | `DEPOSIT`, `PAYOUT`, `REMITTANCE`, `REFUND`, `STATUS_UPDATE`, `DIRECT_DEBIT`, `DEPOSIT_PROFILE`, `SETTLEMENT` |
| `X-Webhook-Timestamp` | ISO-8601 timestamp |
| `X-Webhook-Signature` | hex HMAC-SHA256 (present when a webhook secret is set) |

There is no HTTP Basic Auth and no `X-Callback-Signature`.

```json
{
  "webhook_event_id": "uuid",
  "type": "DEPOSIT",
  "provider_code": "MPESA_KE",
  "transaction_id": "...",
  "provider_transaction_id": "...",
  "timestamp": "...",
  "status": "SUCCESS",
  "amount": "100.00",
  "currency": "KES",
  "merchant_reference": "ORDER-12345",
  "internal_reference": "...",
  "metadata": {},
  "error_message": null
}
```

For a deposit paid in another currency the payload reports the charged `amount` and
`currency` plus `original_amount` and `original_currency` (see [Fees](fees.md)).
The contract does not enumerate `status` values beyond `SUCCESS`, `PENDING`,
`FAILED` and "etc.".

## Verify the signature

The signature is the hex HMAC-SHA256, with your webhook secret, of the **raw
request body**. That body is canonical JSON produced with sorted keys and compact
separators (`json.dumps(payload, separators=(",", ":"), sort_keys=True)`).

```ts
client.webhooks.verify(rawBody, signature, secret);       // boolean
client.webhooks.verifyOrFail(rawBody, signature, secret); // throws WebhookSignatureException
```

`verify` returns `false` for an empty signature or secret and compares in constant
time. Pass the bytes exactly as received: do **not** `JSON.parse` then
`JSON.stringify` (key order and escaping of non-ASCII characters can differ from the
canonical form and the check fails). In Express keep the raw body:

```ts
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody: string }).rawBody = buf.toString("utf8");
    },
  }),
);
```

## Respond and retries

Answer HTTP 2xx quickly (after storing the event), then process. Retries follow the
matching webhook rule (`max_retries`, `retry_delay_seconds`); the defaults are not
stated in the contract. Because of retries, handle each event once: deduplicate on
`webhook_event_id` (or `merchant_reference` plus `status`). Treat the webhook and
[status check](status.md) as equivalent sources of truth, and ignore a status that
would move a transaction backwards from a final state.

## Complete minimal example

```ts
import express from "express";
import { Client } from "@mainmoneyapp/sdk";

const client = new Client({ clientId: process.env.MM_CLIENT_ID ?? "", secret: process.env.MM_API_SECRET ?? "", test: true });
const app = express();
const seen = new Set<string>(); // use your database in production

app.post(
  "/webhooks",
  express.raw({ type: "application/json" }), // req.body is a Buffer of the raw bytes
  (req, res) => {
    const raw = (req.body as Buffer).toString("utf8");
    const signature = req.header("x-webhook-signature") ?? "";
    if (!client.webhooks.verify(raw, signature, process.env.MM_WEBHOOK_SECRET ?? "")) {
      res.status(400).json({ message: "Invalid signature" });
      return;
    }
    const event = JSON.parse(raw) as { webhook_event_id: string; merchant_reference: string; status: string };
    if (!seen.has(event.webhook_event_id)) {
      seen.add(event.webhook_event_id);
      // update your order for event.merchant_reference from event.status
    }
    res.json({ ok: true });
  },
);

app.listen(8004);
```
