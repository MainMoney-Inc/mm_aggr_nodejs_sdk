/** MainMoney Rails: transfers between a platform wallet and a seller's wallet. */

import { Resource } from "./resource.js";

export type TransferDirection = "TO_SUB_MERCHANT" | "FROM_SUB_MERCHANT";

/** Body of POST /transactions/transfers/ (MerchantTransferRequest). */
export interface TransferCreateInput {
  /** Your reference (max 100 chars), unique per platform. Sending it again with the same details is a replay. */
  reference: string;
  /** TO_SUB_MERCHANT funds the seller from the platform wallet; FROM_SUB_MERCHANT sweeps funds back. */
  direction: TransferDirection;
  /** The seller's id (uuid). */
  sub_merchant_id: string;
  /** Decimal string, at most 2 decimal places. */
  amount: string;
  /** Currency code (max 10 chars). */
  currency: string;
  /** Max 255 chars. */
  description?: string;
}

/** A transfer, seen from the platform (MerchantTransfer). */
export interface Transfer {
  id: string;
  reference: string;
  direction: string;
  platform_merchant_id: string;
  sub_merchant_id: string;
  amount: string;
  currency: string;
  description: string;
  channel: "API" | "BACKOFFICE";
  created_at: string;
}

export interface TransferListQuery {
  reference?: string;
  sub_merchant_id?: string;
}

export class Transfers extends Resource {
  /** POST /transactions/transfers/ (201 on creation, 200 on a replay of the same reference and details). */
  create(payload: TransferCreateInput): Promise<Transfer> {
    return this.transport.post("transactions/transfers/", { ...payload }) as unknown as Promise<Transfer>;
  }

  /** GET /transactions/transfers/ : the platform's transfers (a plain array). */
  list(query: TransferListQuery = {}): Promise<Transfer[]> {
    return this.transport.get("transactions/transfers/", { ...query }) as unknown as Promise<Transfer[]>;
  }

  /** GET /transactions/transfers/{id}/ */
  get(id: string): Promise<Transfer> {
    return this.transport.get(`transactions/transfers/${encodeURIComponent(id)}/`) as unknown as Promise<Transfer>;
  }
}
