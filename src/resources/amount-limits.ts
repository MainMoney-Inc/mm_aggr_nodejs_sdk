/** Amount limits. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource } from "./resource.js";

export class AmountLimits extends Resource {
  list(query: QueryParams = {}): Promise<JsonValue> {
    return this.transport.get("manage/general/amount-limits/", query);
  }
}
