/** Exchange client_id/secret for a Bearer token and cache it. */

import { AuthenticationException } from "../errors.js";
import type { HttpClient } from "../http/http-client.js";
import { AccessToken } from "./access-token.js";

export class TokenStore {
  private current: AccessToken | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly baseUri: string,
    private readonly clientId: string,
    private readonly secret: string,
    private readonly expiresIn: number | null = null,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.current === null || this.current.isExpiring()) {
      this.current = await this.exchange();
    }
    return this.current.accessToken;
  }

  invalidate(): void {
    this.current = null;
  }

  private async exchange(): Promise<AccessToken> {
    const body: Record<string, unknown> = {
      client_id: this.clientId,
      secret: this.secret,
    };
    if (this.expiresIn !== null) {
      body.expires_in = this.expiresIn;
    }

    const url = `${this.baseUri.replace(/\/+$/, "")}/auth/tokens/exchange/`;
    const response = await this.http.request("POST", url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      json: body,
    });

    let decoded: unknown = null;
    try {
      decoded = response.body ? JSON.parse(response.body) : null;
    } catch {
      decoded = null;
    }

    const accessToken =
      isPlainObject(decoded) && typeof decoded.access_token === "string" ? decoded.access_token : null;
    if (response.statusCode >= 400 || accessToken === null) {
      throw new AuthenticationException("Token exchange failed");
    }

    const expiresAtRaw = isPlainObject(decoded) && typeof decoded.expires_at === "string" ? decoded.expires_at : null;
    const expiresAt =
      expiresAtRaw !== null ? parseExpiresAt(expiresAtRaw) : new Date(Date.now() + 60 * 60 * 1000);
    const tokenType =
      isPlainObject(decoded) && typeof decoded.token_type === "string" ? decoded.token_type : "Bearer";
    const expiresInRaw = isPlainObject(decoded) ? decoded.expires_in : undefined;
    const expiresIn = toExpiresIn(expiresInRaw);

    return new AccessToken(accessToken, tokenType, expiresIn, expiresAt);
  }
}

function parseExpiresAt(value: string): Date {
  const normalized = value.endsWith("Z") ? `${value.slice(0, -1)}+00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
  return parsed;
}

function toExpiresIn(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return 3600;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
