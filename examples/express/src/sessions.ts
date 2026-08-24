import { randomBytes } from "node:crypto";

const TTL_MS = 30 * 60 * 1000;

export type CheckoutSession = {
  token: string;
  reference: string;
  amount: string | null;
  currency: string | null;
  lockAmount: boolean;
  operation: string;
  expiresAt: number;
  orderId: number | null;
  transferId: number | null;
};

const sessions = new Map<string, CheckoutSession>();

export function createSession(input: Omit<CheckoutSession, "token" | "expiresAt">): CheckoutSession {
  const session: CheckoutSession = {
    ...input,
    token: randomBytes(18).toString("hex"),
    expiresAt: Date.now() + TTL_MS,
  };
  sessions.set(session.token, session);
  return session;
}

export function getSession(token: string): CheckoutSession | undefined {
  const session = sessions.get(token);
  if (session === undefined || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return undefined;
  }
  return session;
}
