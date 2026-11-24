/** Deposits (inbound payments). */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource, type AccountRequestOptions } from "./resource.js";

export class Deposits extends Resource {
  /** POST /transactions/deposits/ (optional Idempotency-Key and X-Merchant-Account). */
  create(
    payload: JsonObject,
    idempotencyKey?: string | null,
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.post("transactions/deposits/", payload, this.createHeaders(idempotencyKey, options));
  }

  /** POST /transactions/deposits/validate-payment/ (authenticator token confirmation). */
  validatePayment(payload: JsonObject = {}, options: AccountRequestOptions = {}): Promise<JsonValue> {
    return this.transport.post("transactions/deposits/validate-payment/", payload, this.accountHeaders(options));
  }

  /**
   * POST /transactions/card-deposits/validate-payment/. The contract lists no
   * X-Merchant-Account or Idempotency-Key for this path, so none is sent.
   */
  validateCardPayment(payload: JsonObject = {}): Promise<JsonValue> {
    return this.transport.post("transactions/card-deposits/validate-payment/", payload);
  }
}
