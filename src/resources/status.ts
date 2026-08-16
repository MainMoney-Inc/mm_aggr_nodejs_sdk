/** Transaction status checks. */

import type { JsonValue } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Status extends Resource {
  check(operationType: string, reference: string): Promise<JsonValue> {
    return this.transport.post(`transactions/status/check/${operationType}/`, { reference });
  }
}
