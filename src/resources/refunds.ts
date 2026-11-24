/** Refunds (X-Merchant-Account and Idempotency-Key supported). */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource, type AccountRequestOptions } from "./resource.js";

export class Refunds extends Resource {
  create(
    payload: JsonObject,
    idempotencyKey?: string | null,
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.post("transactions/refunds/", payload, this.createHeaders(idempotencyKey, options));
  }
}
