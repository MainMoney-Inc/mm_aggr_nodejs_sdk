/** Customer lookup, KYC, and provider match. */

import type { JsonObject, JsonValue } from "../http/transport.js";
import { Resource } from "./resource.js";

export class Customers extends Resource {
  lookup(payload: JsonObject): Promise<JsonValue> {
    return this.transport.post("transactions/customers/lookup/", payload);
  }

  kyc(payload: JsonObject): Promise<JsonValue> {
    return this.transport.post("transactions/customers/kyc/", payload);
  }

  matchProvider(accountNumber: string, getLookup = false, operationType?: string): Promise<JsonValue> {
    return this.transport.get("transactions/customers/match-provider/", {
      account_number: accountNumber,
      get_lookup: getLookup ? "true" : null,
      operation_type: operationType ?? null,
    });
  }
}
