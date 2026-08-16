/** Refund operations. */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Refunds extends Resource {
  create(payload: JsonObject, idempotencyKey?: string | null): Promise<JsonValue> {
    return this.transport.post("transactions/refunds/", payload, this.idempotencyHeaders(idempotencyKey));
  }
}
