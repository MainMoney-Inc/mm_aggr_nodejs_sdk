/** Payout operations. */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Payouts extends Resource {
  create(payload: JsonObject, idempotencyKey?: string | null): Promise<JsonValue> {
    return this.transport.post("transactions/payouts/", payload, this.idempotencyHeaders(idempotencyKey));
  }

  createBusiness(payload: JsonObject, idempotencyKey?: string | null): Promise<JsonValue> {
    return this.transport.post(
      "transactions/payouts/business/",
      payload,
      this.idempotencyHeaders(idempotencyKey),
    );
  }

  createBusinessMerchantAccount(payload: JsonObject, idempotencyKey?: string | null): Promise<JsonValue> {
    return this.transport.post(
      "transactions/payouts/business/merchant-account/",
      payload,
      this.idempotencyHeaders(idempotencyKey),
    );
  }
}
