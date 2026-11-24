/** Base merchant API resource. */

import type { Transport } from "../http/transport.js";

/**
 * Per-call option to act on behalf of one of your sellers (MainMoney Rails).
 * Sent as the `X-Merchant-Account` header.
 *
 * - omitted / `undefined`: the client-wide `merchantAccount` (if any) applies;
 * - a seller account id: that seller, overriding the client-wide default;
 * - `null` or `""`: send no header for this call, even when the client has a default.
 */
export interface AccountRequestOptions {
  merchantAccount?: string | null;
}

export interface ResourceOptions {
  /** Client-wide default for `X-Merchant-Account`. */
  merchantAccount?: string | null;
}

export abstract class Resource {
  protected readonly defaultMerchantAccount: string | null;

  constructor(
    protected readonly transport: Transport,
    options: ResourceOptions = {},
  ) {
    this.defaultMerchantAccount = emptyToNull(options.merchantAccount);
  }

  protected idempotencyHeaders(idempotencyKey?: string | null): Record<string, string> {
    if (idempotencyKey === undefined || idempotencyKey === null || idempotencyKey === "") {
      return {};
    }
    return { "Idempotency-Key": idempotencyKey };
  }

  /** `X-Merchant-Account` for a call: per-call value wins, then the client-wide default. */
  protected accountHeaders(options?: AccountRequestOptions): Record<string, string> {
    const account =
      options !== undefined && options.merchantAccount !== undefined
        ? emptyToNull(options.merchantAccount)
        : this.defaultMerchantAccount;
    return account === null ? {} : { "X-Merchant-Account": account };
  }

  /** Idempotency-Key and X-Merchant-Account together (transaction creates). */
  protected createHeaders(
    idempotencyKey?: string | null,
    options?: AccountRequestOptions,
  ): Record<string, string> {
    return { ...this.idempotencyHeaders(idempotencyKey), ...this.accountHeaders(options) };
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  return value === undefined || value === null || value === "" ? null : value;
}
