import Database from "better-sqlite3";

import { getClient } from "./client.js";
import type { CheckoutSession } from "./sessions.js";

type SqliteDb = InstanceType<typeof Database>;
type ProxyResult = { status: number; body: unknown };

export async function handleProxy(
  db: SqliteDb,
  method: string,
  route: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
  session: CheckoutSession,
): Promise<ProxyResult> {
  try {
    const payload = await dispatch(db, method.toUpperCase(), route.replace(/^\/+|\/+$/g, ""), query, body, session);
    return { status: 200, body: payload };
  } catch (error) {
    const status = typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 400;
    const message = error instanceof Error ? error.message : "Merchant backend request failed";
    return { status: status >= 400 ? status : 400, body: { message } };
  }
}

async function dispatch(
  db: SqliteDb,
  method: string,
  route: string,
  query: Record<string, string>,
  body: Record<string, unknown>,
  session: CheckoutSession,
): Promise<unknown> {
  const client = getClient();
  if (method === "GET" && route === "countries") {
    return client.countries.list();
  }
  if (method === "GET" && route === "providers") {
    return client.providers.list(query);
  }
  if (method === "GET" && route === "match-provider") {
    return client.customers.matchProvider(
      query.account_number ?? "",
      query.get_lookup === "true" || query.get_lookup === "1",
      query.operation_type || undefined,
    );
  }
  if (method === "GET" && route === "amount-limits") {
    return client.amountLimits.list(query);
  }
  if (method === "POST" && route === "fees/simulate") {
    return client.fees.simulate(body);
  }
  if (method === "GET" && route === "checkout-preferences") {
    return client.checkoutPreferences.get();
  }
  if (method === "POST" && route === "deposits") {
    const payload = { ...body, reference: session.reference };
    if (session.lockAmount && session.amount !== null) {
      payload.amount = session.amount;
    }
    const result = await client.deposits.create(payload, session.reference);
    markOrder(db, session, "pending");
    return result;
  }
  if (method === "POST" && route === "payouts") {
    const payload = { ...body, reference: session.reference };
    if (session.lockAmount && session.amount !== null) {
      payload.amount = session.amount;
    }
    const destination = String(payload.customer_phone ?? payload.destination_account ?? "");
    const result = await client.payouts.create(payload, session.reference);
    markTransfer(db, session, "pending", destination);
    return result;
  }
  if (method === "GET" && route === "status") {
    const reference = query.reference || session.reference;
    const operation = query.operation || session.operation || "deposit";
    const result = await client.status.check(operation, reference);
    const status = extractStatus(result);
    if (operation === "payout") {
      markTransfer(db, session, status);
    } else {
      markOrder(db, session, status);
    }
    return result;
  }
  throw new Error("Unknown merchant backend path");
}

function extractStatus(result: unknown): string {
  if (result !== null && typeof result === "object") {
    const raw = (result as { status?: unknown; transaction_status?: unknown }).status
      ?? (result as { transaction_status?: unknown }).transaction_status;
    if (typeof raw === "string" && raw !== "") {
      return raw.toLowerCase();
    }
  }
  return "pending";
}

function mapStatus(status: string): string {
  const lowered = status.toLowerCase();
  if (["success", "successful", "paid", "completed"].includes(lowered)) {
    return "paid";
  }
  if (["failed", "error", "cancelled", "canceled"].includes(lowered)) {
    return "failed";
  }
  if (lowered === "refunded") {
    return "refunded";
  }
  return "pending";
}

function markOrder(db: SqliteDb, session: CheckoutSession, status: string): void {
  if (session.orderId === null) {
    return;
  }
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(mapStatus(status), session.orderId);
}

function markTransfer(db: SqliteDb, session: CheckoutSession, status: string, destination = ""): void {
  if (session.transferId === null) {
    return;
  }
  if (destination !== "") {
    db.prepare("UPDATE transfers SET status = ?, destination = ? WHERE id = ?").run(
      mapStatus(status),
      destination,
      session.transferId,
    );
    return;
  }
  db.prepare("UPDATE transfers SET status = ? WHERE id = ?").run(mapStatus(status), session.transferId);
}
