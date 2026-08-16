/** Merchant wallet balances. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Wallets extends Resource {
  list(query: QueryParams = {}): Promise<JsonValue> {
    return this.transport.get("manage/merchant-admin/wallets/", query);
  }
}
