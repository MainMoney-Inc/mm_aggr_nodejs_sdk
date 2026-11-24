export { Client, type ClientOptions } from "./client.js";
export {
  AggregatorException,
  ApiException,
  AuthenticationException,
  WebhookSignatureException,
} from "./errors.js";
export type { HttpClient, RequestOptions } from "./http/http-client.js";
export type { JsonObject, JsonValue } from "./http/transport.js";

export type {
  PaymentLink,
  PaymentLinkCreateInput,
  PaymentLinkListQuery,
  PaymentLinkMethod,
  PaymentLinkPage,
  PaymentLinkRequestOptions,
  PaymentLinkStatus,
} from "./resources/payment-links.js";

export const VERSION = "0.2.0";
