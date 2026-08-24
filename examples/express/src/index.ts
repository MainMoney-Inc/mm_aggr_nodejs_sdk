import { randomBytes } from "node:crypto";

import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { getClient } from "./client.js";
import { openDb, seedProducts, type Order, type Product, type Transfer } from "./db.js";
import { handleProxy } from "./proxy.js";
import { createSession, getSession } from "./sessions.js";

dotenv.config();

const db = openDb();
seedProducts(db);

const app = express();
const origins = (process.env.CORS_ORIGINS ?? "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://127.0.0.1:4200")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json());

function bearerToken(header: string | undefined): string {
  if (header !== undefined && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return "";
}

app.get("/products", (_req, res) => {
  const rows = db.prepare("SELECT * FROM products ORDER BY id").all() as Product[];
  res.json(rows);
});

app.get("/products/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(req.params.id)) as Product | undefined;
  if (product === undefined) {
    res.status(404).json({ message: "Product not found" });
    return;
  }
  res.json(product);
});

app.post("/session", (req, res) => {
  let operation = String(req.body?.operation ?? "deposit");
  const productId = req.body?.product_id;
  let amount = req.body?.amount as string | undefined;
  let currency = req.body?.currency as string | undefined;
  let lockAmount = true;
  let orderId: number | null = null;
  let transferId: number | null = null;
  const reference = `EX-${randomBytes(6).toString("hex").toUpperCase()}`;

  if (productId !== undefined && productId !== null) {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(productId)) as Product | undefined;
    if (product === undefined) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    amount = product.price;
    currency = product.currency;
    const info = db.prepare(
      "INSERT INTO orders (reference, product_id, amount, currency, status) VALUES (?, ?, ?, ?, 'pending')",
    ).run(reference, product.id, product.price, product.currency);
    orderId = Number(info.lastInsertRowid);
    operation = "deposit";
  } else if (operation === "payout") {
    if (amount === undefined || currency === undefined) {
      res.status(400).json({ message: "amount and currency are required for payouts" });
      return;
    }
    const info = db.prepare(
      "INSERT INTO transfers (reference, amount, currency, status) VALUES (?, ?, ?, 'pending')",
    ).run(reference, String(amount), String(currency));
    transferId = Number(info.lastInsertRowid);
  } else if (amount && currency) {
    lockAmount = Boolean(req.body?.lockAmount ?? true);
  } else {
    res.status(400).json({ message: "product_id or amount and currency are required" });
    return;
  }

  const session = createSession({
    reference,
    amount: amount !== undefined ? String(amount) : null,
    currency: currency !== undefined ? String(currency) : null,
    lockAmount,
    operation,
    orderId,
    transferId,
  });
  const base = `${req.protocol}://${req.get("host")}`;
  res.json({
    merchantBackendUrl: `${base}/payments`,
    clientToken: session.token,
    pollUrl: `${base}/payments/status`,
    pollHeaders: { Authorization: `Bearer ${session.token}` },
    locale: "en",
    amount: session.amount,
    currency: session.currency,
    lockAmount: session.lockAmount,
    reference: session.reference,
    operation: session.operation,
  });
});

app.get("/orders", (_req, res) => {
  res.json(db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as Order[]);
});

app.post("/orders/:id/refund", async (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(Number(req.params.id)) as Order | undefined;
  if (order === undefined) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  if (order.status !== "paid") {
    res.status(400).json({ message: "Only paid orders can be refunded" });
    return;
  }
  const refundReference = `RF-${randomBytes(6).toString("hex").toUpperCase()}`;
  const result = await getClient().refunds.create(
    {
      reference: refundReference,
      original_transaction_id: order.reference,
      amount: order.amount,
      currency: order.currency,
      reason: "Example shop refund",
    },
    refundReference,
  );
  db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?").run(order.id);
  res.json({ order: { ...order, status: "refunded" }, refund: result });
});

app.get("/transfers", (_req, res) => {
  res.json(db.prepare("SELECT * FROM transfers ORDER BY id DESC").all() as Transfer[]);
});

app.post("/transfers", async (req, res) => {
  const amount = req.body?.amount;
  const currency = req.body?.currency;
  const destination = String(req.body?.destination ?? req.body?.customer_phone ?? "");
  if (amount === undefined || currency === undefined) {
    res.status(400).json({ message: "amount and currency are required" });
    return;
  }
  const reference = `PO-${randomBytes(6).toString("hex").toUpperCase()}`;
  const result = await getClient().payouts.create(
    {
      provider_code: req.body?.provider_code,
      reference,
      amount: String(amount),
      currency: String(currency),
      customer_phone: destination,
    },
    reference,
  );
  const info = db.prepare(
    "INSERT INTO transfers (reference, amount, currency, destination, status) VALUES (?, ?, ?, ?, 'pending')",
  ).run(reference, String(amount), String(currency), destination);
  res.status(201).json({
    transfer: {
      id: Number(info.lastInsertRowid),
      reference,
      amount: String(amount),
      currency: String(currency),
      destination,
      status: "pending",
    },
    payout: result,
  });
});

app.all(["/payments", "/payments/*path"], async (req, res) => {
  const token = bearerToken(req.header("authorization"));
  const session = getSession(token);
  if (session === undefined) {
    res.status(401).json({ message: "Invalid checkout session" });
    return;
  }
  const extra = req.params.path;
  const route = Array.isArray(extra) ? extra.join("/") : typeof extra === "string" ? extra : "";
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === "string") {
      query[key] = value;
    }
  }
  const body = typeof req.body === "object" && req.body !== null ? req.body as Record<string, unknown> : {};
  const result = await handleProxy(db, req.method, route, query, body, session);
  res.status(result.status).json(result.body);
});

app.post("/webhooks", (req, res) => {
  const raw = JSON.stringify(req.body ?? {});
  const signature = req.header("x-webhook-signature") ?? "";
  if (!getClient().webhooks.verify(raw, signature, process.env.MM_WEBHOOK_SECRET ?? "")) {
    res.status(400).json({ message: "Invalid signature" });
    return;
  }
  const payload = req.body as Record<string, unknown>;
  const reference = String(payload.reference ?? payload.merchant_reference ?? "");
  const status = String(payload.status ?? "pending").toLowerCase();
  const mapped = ["success", "successful", "paid", "completed"].includes(status)
    ? "paid"
    : ["failed", "error"].includes(status)
      ? "failed"
      : status;
  if (reference !== "") {
    db.prepare("UPDATE orders SET status = ? WHERE reference = ?").run(mapped, reference);
    db.prepare("UPDATE transfers SET status = ? WHERE reference = ?").run(mapped, reference);
  }
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 8004);
app.listen(port, "127.0.0.1", () => {
  console.log(`MainMoney Express example on http://127.0.0.1:${port}`);
});
