/** Payment link operations (API key scope PAYMENT_LINK). */

import { Resource } from "./resource.js";

export type PaymentLinkStatus = "ACTIVE" | "PAID" | "EXPIRED" | "CANCELLED";
export type PaymentLinkMethod = "card" | "mobile_money";

/** Body of POST /payment-links/ (PaymentLinkCreate). */
export interface PaymentLinkCreateInput {
  /** Your unique reference for this link (max 100 chars). */
  reference: string;
  /** Decimal string, for example "25.00". */
  amount: string;
  /** Three-letter currency code. */
  currency: string;
  title?: string;
  description?: string;
  /** Subset of card, mobile_money. Empty or omitted offers every available method. */
  methods?: PaymentLinkMethod[];
  /** ISO 8601 date-time, or null for no expiry. */
  expires_at?: string | null;
  /** Defaults to true on the API: the link closes after the first successful payment. */
  single_use?: boolean;
  redirect_url?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  metadata?: Record<string, unknown>;
}

/** Merchant view of a payment link (PaymentLink). */
export interface PaymentLink {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  title: string;
  description: string;
  status: PaymentLinkStatus;
  methods: unknown;
  effective_methods: string[];
  expires_at: string | null;
  single_use: boolean;
  redirect_url: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  metadata: unknown;
  paid_at: string | null;
  /** Public payment URL the customer pays at. */
  url: string;
  /** Seller the link was created for (X-Merchant-Account); null for your own links. */
  account_id: string | null;
  created_at: string;
}

/** Paginated list (PaginatedPaymentLinkList). */
export interface PaymentLinkPage {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: PaymentLink[];
}

export interface PaymentLinkListQuery {
  status?: PaymentLinkStatus;
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface PaymentLinkRequestOptions {
  /** Seller account id sent as X-Merchant-Account (MainMoney Rails only). */
  merchantAccount?: string | null;
}

export class PaymentLinks extends Resource {
  create(payload: PaymentLinkCreateInput, options: PaymentLinkRequestOptions = {}): Promise<PaymentLink> {
    return this.transport.post(
      "payment-links/",
      { ...payload },
      this.merchantHeaders(options.merchantAccount),
    ) as unknown as Promise<PaymentLink>;
  }

  list(query: PaymentLinkListQuery = {}, options: PaymentLinkRequestOptions = {}): Promise<PaymentLinkPage> {
    return this.transport.get(
      "payment-links/",
      { ...query },
      this.merchantHeaders(options.merchantAccount),
    ) as unknown as Promise<PaymentLinkPage>;
  }

  get(id: string, options: PaymentLinkRequestOptions = {}): Promise<PaymentLink> {
    return this.transport.get(
      `payment-links/${encodeURIComponent(id)}/`,
      {},
      this.merchantHeaders(options.merchantAccount),
    ) as unknown as Promise<PaymentLink>;
  }

  cancel(id: string, options: PaymentLinkRequestOptions = {}): Promise<PaymentLink> {
    return this.transport.post(
      `payment-links/${encodeURIComponent(id)}/cancel/`,
      {},
      this.merchantHeaders(options.merchantAccount),
    ) as unknown as Promise<PaymentLink>;
  }

  private merchantHeaders(merchantAccount?: string | null): Record<string, string> {
    if (merchantAccount === undefined || merchantAccount === null || merchantAccount === "") {
      return {};
    }
    return { "X-Merchant-Account": merchantAccount };
  }
}
