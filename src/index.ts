export { Client, type ClientOptions } from "./client.js";
export {
  AggregatorException,
  ApiException,
  AuthenticationException,
  WebhookSignatureException,
} from "./errors.js";
export type { HttpClient, RequestOptions } from "./http/http-client.js";
export type { AccountRequestOptions } from "./resources/resource.js";
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

export type {
  PricingItem,
  PricingList,
  PricingQuery,
} from "./resources/pricing.js";
export type {
  ReportProviderTotal,
  ReportQuery,
  ReportTopTransaction,
  ReportVolumeByDay,
  ReportsCharts,
  ReportsSummary,
} from "./resources/reports.js";
export type {
  KybDraftInput,
  KybStatus,
  KybUbo,
  Seller,
  SellerCaptureToken,
  SellerCountry,
  SellerCreateInput,
  SellerDetail,
  SellerKyb,
  SellerKybStart,
  SellerList,
  SellerOnboardingLink,
  SellerOnboardingLinkRevoked,
  SellerType,
  SellerUpdateInput,
} from "./resources/sellers.js";
export type { StatusOperationType } from "./resources/status.js";
export type { TransactionListType } from "./resources/transactions.js";
export type {
  Transfer,
  TransferCreateInput,
  TransferDirection,
  TransferListQuery,
} from "./resources/transfers.js";

export const VERSION = "0.2.1";
