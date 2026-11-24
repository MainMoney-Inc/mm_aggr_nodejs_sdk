/** Payouts (outbound payments). */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource, type AccountRequestOptions } from "./resource.js";

export class Payouts extends Resource {
  /** POST /transactions/payouts/ */
  create(
    payload: JsonObject,
    idempotencyKey?: string | null,
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.post("transactions/payouts/", payload, this.createHeaders(idempotencyKey, options));
  }

  /** POST /transactions/payouts/business/ (beneficiary phone number; scope BUSINESS_PAYOUT). */
  createBusiness(
    payload: JsonObject,
    idempotencyKey?: string | null,
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.post(
      "transactions/payouts/business/",
      payload,
      this.createHeaders(idempotencyKey, options),
    );
  }

  /** POST /transactions/payouts/business/merchant-account/ (provider shortcode; scope BUSINESS_PAYOUT). */
  createBusinessMerchantAccount(
    payload: JsonObject,
    idempotencyKey?: string | null,
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.post(
      "transactions/payouts/business/merchant-account/",
      payload,
      this.createHeaders(idempotencyKey, options),
    );
  }

  /**
   * POST /transactions/card-payouts/business/merchant-account/. The contract lists no
   * X-Merchant-Account or Idempotency-Key for this path, so none is sent.
   */
  createCardBusinessMerchantAccount(payload: JsonObject): Promise<JsonValue> {
    return this.transport.post("transactions/card-payouts/business/merchant-account/", payload);
  }
}
