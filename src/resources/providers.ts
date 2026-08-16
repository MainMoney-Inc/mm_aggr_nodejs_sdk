/** Financial entities (providers) filtered to effective countries. */

import type { JsonValue, QueryParams } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Providers extends Resource {
  list(query: QueryParams = {}): Promise<JsonValue> {
    return this.transport.get("manage/general/financial-entities/", query);
  }
}
