/** Effective country allow-list. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Countries extends Resource {
  list(query: QueryParams = {}): Promise<JsonValue> {
    return this.transport.get("manage/general/countries/", query);
  }
}
