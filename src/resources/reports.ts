/** Merchant reports (charts and summary). */

import { Resource, type AccountRequestOptions } from "./resource.js";

export interface ReportQuery {
  currency?: string;
  /** Date filter as the API accepts it (the contract does not state the format; ISO dates are typical). */
  date_from?: string;
  date_to?: string;
  operation_type?: string;
  provider_code?: string;
}

export interface ReportVolumeByDay {
  date: string;
  currency: string;
  count: number;
  total_amount: string;
}

export interface ReportsCharts {
  volume_by_day: ReportVolumeByDay[];
}

export interface ReportProviderTotal {
  provider_code: string;
  currency: string;
  count: number;
  total_amount: string;
  success_count: number;
}

export interface ReportTopTransaction {
  operation_type: string;
  amount: string;
  currency: string;
  provider_code: string;
  merchant_reference: string | null;
  internal_reference: string;
  created_at: string;
}

export interface ReportsSummary {
  totals_by_provider: ReportProviderTotal[];
  top_transactions: ReportTopTransaction[];
}

export class Reports extends Resource {
  /** GET /manage/merchant-admin/reports/charts/ : daily volume per currency. */
  charts(query: ReportQuery = {}, options: AccountRequestOptions = {}): Promise<ReportsCharts> {
    return this.transport.get(
      "manage/merchant-admin/reports/charts/",
      { ...query },
      this.accountHeaders(options),
    ) as unknown as Promise<ReportsCharts>;
  }

  /** GET /manage/merchant-admin/reports/summary/ : totals per provider and top transactions. */
  summary(query: ReportQuery = {}, options: AccountRequestOptions = {}): Promise<ReportsSummary> {
    return this.transport.get(
      "manage/merchant-admin/reports/summary/",
      { ...query },
      this.accountHeaders(options),
    ) as unknown as Promise<ReportsSummary>;
  }
}

