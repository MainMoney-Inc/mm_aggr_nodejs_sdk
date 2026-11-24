/** Transaction status check. */

import type { JsonValue } from "../http/transport.js";
import { Resource, type AccountRequestOptions } from "./resource.js";

export type StatusOperationType = "deposit" | "payout" | "refund" | "remittance";

export class Status extends Resource {
  /** POST /transactions/status/check/{operation_type}/ with `reference` (merchant or internal). */
  check(
    operationType: StatusOperationType | (string & {}),
    reference: string,
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.post(
      `transactions/status/check/${encodeURIComponent(operationType)}/`,
      { reference },
      this.accountHeaders(options),
    );
  }
}
