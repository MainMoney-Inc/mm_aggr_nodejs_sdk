/** Deposit operations. */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Deposits extends Resource {
  create(payload: JsonObject, idempotencyKey?: string | null): Promise<JsonValue> {
    return this.transport.post("transactions/deposits/", payload, this.idempotencyHeaders(idempotencyKey));
  }

  validatePayment(payload: JsonObject = {}): Promise<JsonValue> {
    return this.transport.post("transactions/deposits/validate-payment/", payload);
  }
}
