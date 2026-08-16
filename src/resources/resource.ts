/** Base merchant API resource. */

import type { Transport } from "../http/transport.js";

export abstract class Resource {
  constructor(protected readonly transport: Transport) {}

  protected idempotencyHeaders(idempotencyKey?: string | null): Record<string, string> {
    if (idempotencyKey === undefined || idempotencyKey === null || idempotencyKey === "") {
      return {};
    }
    return { "Idempotency-Key": idempotencyKey };
  }
}
