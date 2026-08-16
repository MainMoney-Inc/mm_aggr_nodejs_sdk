/** Merchant API client facade. */

import { TokenStore } from "./auth/token-store.js";
import { FetchHttpClient } from "./http/fetch-client.js";
import type { HttpClient } from "./http/http-client.js";
import { Transport } from "./http/transport.js";
import { AmountLimits } from "./resources/amount-limits.js";
import { CheckoutPreferences } from "./resources/checkout-preferences.js";
import { Countries } from "./resources/countries.js";
import { Customers } from "./resources/customers.js";
import { Deposits } from "./resources/deposits.js";
import { Fees } from "./resources/fees.js";
import { Payouts } from "./resources/payouts.js";
import { Providers } from "./resources/providers.js";
import { Refunds } from "./resources/refunds.js";
import { Remittances } from "./resources/remittances.js";
import { Status } from "./resources/status.js";
import { Transactions } from "./resources/transactions.js";
import { Wallets } from "./resources/wallets.js";
import { WebhookVerifier } from "./webhook/verifier.js";

export interface ClientOptions {
  clientId: string;
  secret: string;
  baseUri?: string;
  test?: boolean;
  httpClient?: HttpClient;
  timeout?: number;
  tokenExpiresIn?: number;
}

export class Client {
  static readonly PRODUCTION_BASE_URI = "https://aggregator.mainmoney.net/api/v1/";
  static readonly TEST_BASE_URI = "https://testaggregator.mainmoney.net/api/v1/";

  readonly deposits: Deposits;
  readonly payouts: Payouts;
  readonly remittances: Remittances;
  readonly refunds: Refunds;
  readonly status: Status;
  readonly customers: Customers;
  readonly wallets: Wallets;
  readonly transactions: Transactions;
  readonly countries: Countries;
  readonly providers: Providers;
  readonly fees: Fees;
  readonly amountLimits: AmountLimits;
  readonly checkoutPreferences: CheckoutPreferences;
  readonly webhooks: WebhookVerifier;

  private readonly _baseUri: string;

  constructor(options: ClientOptions) {
    this._baseUri = Client.normalizeBaseUri(
      options.baseUri ?? (options.test ? Client.TEST_BASE_URI : Client.PRODUCTION_BASE_URI),
    );
    const http = options.httpClient ?? new FetchHttpClient(options.timeout ?? 30.0);
    const tokens = new TokenStore(
      http,
      this._baseUri,
      options.clientId,
      options.secret,
      options.tokenExpiresIn ?? null,
    );
    const transport = new Transport(http, this._baseUri, tokens);

    this.deposits = new Deposits(transport);
    this.payouts = new Payouts(transport);
    this.remittances = new Remittances(transport);
    this.refunds = new Refunds(transport);
    this.status = new Status(transport);
    this.customers = new Customers(transport);
    this.wallets = new Wallets(transport);
    this.transactions = new Transactions(transport);
    this.countries = new Countries(transport);
    this.providers = new Providers(transport);
    this.fees = new Fees(transport);
    this.amountLimits = new AmountLimits(transport);
    this.checkoutPreferences = new CheckoutPreferences(transport);
    this.webhooks = new WebhookVerifier();
  }

  get baseUri(): string {
    return this._baseUri;
  }

  static normalizeBaseUri(baseUri: string): string {
    let normalized = baseUri.trim().replace(/\/+$/, "");
    if (!normalized.toLowerCase().endsWith("/api/v1")) {
      normalized += "/api/v1";
    }
    return `${normalized}/`;
  }
}
