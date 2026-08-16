/** Fee listing and simulation. */

import type { JsonObject, JsonValue, QueryParams } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Fees extends Resource {
  list(query: QueryParams = {}): Promise<JsonValue> {
    return this.transport.get("manage/general/fees/", query);
  }

  simulate(payload: JsonObject): Promise<JsonValue> {
    return this.transport.post("manage/general/fees/simulate/", payload);
  }
}
