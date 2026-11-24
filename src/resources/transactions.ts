/** Merchant-admin transaction listing. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource, type AccountRequestOptions } from "./resource.js";

export type TransactionListType = "deposit" | "payout" | "refund" | "remittance" | "settlement";

export class Transactions extends Resource {
  /** GET /manage/merchant-admin/transactions/{operation_type}/ (paginated). */
  list(
    operationType: TransactionListType | (string & {}),
    query: QueryParams = {},
    options: AccountRequestOptions = {},
  ): Promise<JsonValue> {
    return this.transport.get(
      `manage/merchant-admin/transactions/${encodeURIComponent(operationType)}/`,
      query,
      this.accountHeaders(options),
    );
  }
}
