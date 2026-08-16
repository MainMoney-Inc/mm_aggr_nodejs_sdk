/** Checkout branding for the JS/TS frontend SDK. */

import type { JsonValue } from "../http/transport.js";
import { Resource } from "./resource.js";

export class CheckoutPreferences extends Resource {
  get(): Promise<JsonValue> {
    return this.transport.get("manage/general/checkout-preferences/");
  }
}
