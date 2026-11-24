/** Merchant pricing per operation type. */

import { Resource } from "./resource.js";

export interface PricingQuery {
  /** Scope to one financial entity; defaults to the application's entity. */
  financial_entity_code?: string;
  /** Single operation type; defaults to all merchant-facing operation types. */
  operation_type?: string;
}

export interface PricingItem {
  operation_type: string;
  provider_fee: string;
  provider_fee_declarative?: boolean;
  our_fee: string;
  merchant_additional_fee: string;
  promotion_discount: string;
  total_merchant_fee: string;
  charged_fees?: string;
  provider_fee_rule_id: string | null;
  our_fee_rule_id: string | null;
  promotion_rule_id: string | null;
  merchant_additional_rule_ids: string[];
}

export interface PricingList {
  items: PricingItem[];
}

export class Pricing extends Resource {
  /** GET /manage/general/pricing/ : the price shown now; no transaction is created. */
  get(query: PricingQuery = {}): Promise<PricingList> {
    return this.transport.get("manage/general/pricing/", { ...query }) as unknown as Promise<PricingList>;
  }
}
