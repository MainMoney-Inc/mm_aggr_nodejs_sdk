/** Merchant wallets and balances. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource, type AccountRequestOptions } from "./resource.js";

export class Wallets extends Resource {
  /** GET /manage/merchant-admin/wallets/ (paginated). */
  list(query: QueryParams = {}, options: AccountRequestOptions = {}): Promise<JsonValue> {
    return this.transport.get("manage/merchant-admin/wallets/", query, this.accountHeaders(options));
  }
}
