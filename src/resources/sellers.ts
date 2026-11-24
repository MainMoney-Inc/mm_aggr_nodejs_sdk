/** MainMoney Rails: sellers of a platform and their KYB (business verification). */

import { Resource } from "./resource.js";

export type SellerType = "LEGAL" | "LOGIC";

/** Verification status of a business seller; null for a seller with no verification. */
export type KybStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface SellerCountry {
  /** Send this as `country` when creating a seller. */
  id: string;
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  name: string;
}

/** Body of POST /sellers/ (SubMerchantCreate). */
export interface SellerCreateInput {
  /** LEGAL: a verified business. LOGIC: wallets only, no verification. */
  sub_type: SellerType;
  name: string;
  email: string;
  /** Country id from {@link Sellers.countries}. */
  country: string;
  legal_name?: string;
  phone_number?: string;
  registration_number?: string;
  tax_id?: string;
}

/** Body of PATCH /sellers/{id}/ (the country is fixed at creation). */
export interface SellerUpdateInput {
  name?: string;
  legal_name?: string;
  email?: string;
  notification_email?: string;
  phone_number?: string;
  registration_number?: string;
  tax_id?: string;
}

export interface Seller {
  /** The value of the X-Merchant-Account header for this seller. */
  id: string;
  name: string;
  legal_name: string;
  email: string;
  sub_merchant_type: SellerType;
  kyb_status: string | null;
  /** True when the seller can transact: active and, for a business, APPROVED. */
  is_operational: boolean;
  created_at: string;
}

export interface SellerList {
  count: number;
  results: Seller[];
}

export interface KybUbo {
  name: string;
  /** Date, YYYY-MM-DD. */
  date_of_birth?: string | null;
  /** ISO alpha-2 (max 2 chars). */
  nationality?: string;
  /** Decimal string, for example "51.00". */
  ownership_pct: string;
}

export interface SellerKyb {
  status: KybStatus | null;
  jurisdiction?: string;
  ubos?: KybUbo[];
  no_ubo_reason?: string;
  session_started?: boolean;
  submitted_at?: string | null;
  decided_at?: string | null;
}

/** Body of PATCH /sellers/{id}/kyb/ (PatchedKybDraft). */
export interface KybDraftInput {
  /** Country of registration, ISO alpha-2. */
  jurisdiction?: string;
  ubos?: KybUbo[];
  no_ubo_reason?: string;
}

export interface SellerCaptureToken {
  /** Send as the X-Capture-Token header of each document upload. */
  token: string;
  expires_at: string;
  /** POST each document here as multipart/form-data. */
  upload_url: string;
}

export interface SellerKybStart extends SellerKyb {
  capture_token: SellerCaptureToken | null;
}

export interface SellerDetail extends Seller {
  country: SellerCountry;
  notification_email: string;
  phone_number: string;
  registration_number: string;
  tax_id: string;
  kyb: SellerKyb;
}

export interface SellerOnboardingLink {
  /** Send this to the business. It is shown once. */
  url: string;
  token: string;
  expires_at: string;
}

export interface SellerOnboardingLinkRevoked {
  revoked: number;
}

export class Sellers extends Resource {
  /** GET /sellers/countries/ : countries a seller can be created in. */
  countries(): Promise<SellerCountry[]> {
    return this.transport.get("sellers/countries/") as unknown as Promise<SellerCountry[]>;
  }

  /** GET /sellers/ */
  list(): Promise<SellerList> {
    return this.transport.get("sellers/") as unknown as Promise<SellerList>;
  }

  /** POST /sellers/ */
  create(payload: SellerCreateInput): Promise<Seller> {
    return this.transport.post("sellers/", { ...payload }) as unknown as Promise<Seller>;
  }

  /** GET /sellers/{id}/ */
  get(id: string): Promise<SellerDetail> {
    return this.transport.get(this.path(id)) as unknown as Promise<SellerDetail>;
  }

  /** PATCH /sellers/{id}/ */
  update(id: string, payload: SellerUpdateInput): Promise<Seller> {
    return this.transport.patch(this.path(id), { ...payload }) as unknown as Promise<Seller>;
  }

  /** GET /sellers/{id}/kyb/ */
  kyb(id: string): Promise<SellerKyb> {
    return this.transport.get(this.path(id, "kyb/")) as unknown as Promise<SellerKyb>;
  }

  /** PATCH /sellers/{id}/kyb/ : edit the declared data while the case is DRAFT (or after REJECTED/EXPIRED). */
  updateKyb(id: string, payload: KybDraftInput): Promise<SellerKyb> {
    return this.transport.patch(this.path(id, "kyb/"), { ...payload }) as unknown as Promise<SellerKyb>;
  }

  /** POST /sellers/{id}/kyb/start/ : open the verification session; returns the document upload credential. */
  startKyb(id: string): Promise<SellerKybStart> {
    return this.transport.post(this.path(id, "kyb/start/")) as unknown as Promise<SellerKybStart>;
  }

  /** POST /sellers/{id}/kyb/submit/ : send the case for review (status becomes IN_REVIEW). */
  submitKyb(id: string): Promise<SellerKyb> {
    return this.transport.post(this.path(id, "kyb/submit/")) as unknown as Promise<SellerKyb>;
  }

  /** POST /sellers/{id}/onboarding-link/ : a hosted page where the business completes its own KYB. */
  createOnboardingLink(id: string): Promise<SellerOnboardingLink> {
    return this.transport.post(this.path(id, "onboarding-link/")) as unknown as Promise<SellerOnboardingLink>;
  }

  /** DELETE /sellers/{id}/onboarding-link/ : revoke the live link. */
  revokeOnboardingLink(id: string): Promise<SellerOnboardingLinkRevoked> {
    return this.transport.delete(this.path(id, "onboarding-link/")) as unknown as Promise<SellerOnboardingLinkRevoked>;
  }

  private path(id: string, suffix = ""): string {
    return `sellers/${encodeURIComponent(id)}/${suffix}`;
  }
}
