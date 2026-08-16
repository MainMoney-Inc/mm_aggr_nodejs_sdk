/** Merchant transaction lists. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Transactions extends Resource {
  list(operationType: string, query: QueryParams = {}): Promise<JsonValue> {
    return this.transport.get(`manage/merchant-admin/transactions/${operationType}/`, query);
  }
}
