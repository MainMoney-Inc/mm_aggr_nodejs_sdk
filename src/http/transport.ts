/** Authenticated JSON transport for the merchant API. */

import { ApiException, AuthenticationException } from "../errors.js";
import type { TokenStore } from "../auth/token-store.js";
import type { HttpClient, RequestOptions } from "./http-client.js";
import type { HttpResponse } from "./http-response.js";

export type JsonValue = Record<string, unknown> | unknown[];
export type JsonObject = Record<string, unknown>;
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export class Transport {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUri: string,
    private readonly tokens: TokenStore,
  ) {}

  post(path: string, body: JsonObject = {}, headers: Record<string, string> = {}): Promise<JsonValue> {
    return this.request("POST", path, body, {}, headers);
  }

  get(path: string, query: QueryParams = {}, headers: Record<string, string> = {}): Promise<JsonValue> {
    return this.request("GET", path, null, query, headers);
  }

  private async request(
    method: string,
    path: string,
    body: JsonObject | null,
    query: QueryParams,
    headers: Record<string, string>,
    retried = false,
  ): Promise<JsonValue> {
    const requestHeaders = { ...headers };
    requestHeaders.Authorization = `Bearer ${await this.tokens.getAccessToken()}`;
    try {
      const response = await this.send(method, path, body, query, requestHeaders);
      return this.decode(response);
    } catch (error) {
      if (!(error instanceof AuthenticationException) || retried) {
        throw error;
      }
      this.tokens.invalidate();
      delete requestHeaders.Authorization;
      return this.request(method, path, body, query, requestHeaders, true);
    }
  }

  private async send(
    method: string,
    path: string,
    body: JsonObject | null,
    query: QueryParams,
    headers: Record<string, string>,
  ): Promise<HttpResponse> {
    const options: RequestOptions = { headers };
    if (body !== null) {
      options.json = body;
    }
    const filteredQuery: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        filteredQuery[key] = value;
      }
    }
    if (Object.keys(filteredQuery).length > 0) {
      options.query = filteredQuery;
    }

    const response = await this.http.request(method, this.url(path), options);
    if (response.statusCode === 401) {
      throw new AuthenticationException("Authentication failed");
    }
    return response;
  }

  private decode(response: HttpResponse): JsonValue {
    const status = response.statusCode;
    const raw = response.body;
    const parsed: unknown = raw === "" ? [] : parseJson(raw);
    const decoded: JsonValue = isJsonValue(parsed) ? parsed : [];

    if (status >= 400) {
      if (isPlainObject(decoded) && decoded.success === false) {
        throw ApiException.fromEnvelope(decoded, status);
      }
      let detail: unknown = raw;
      if (isPlainObject(decoded)) {
        detail = decoded.detail ?? decoded.message ?? raw;
      }
      const message = typeof detail === "string" ? detail : "Aggregator request failed";
      throw new ApiException(message, status, isPlainObject(decoded) ? decoded : {}, decoded);
    }

    if (isPlainObject(decoded) && "success" in decoded) {
      if (decoded.success === false) {
        throw ApiException.fromEnvelope(decoded, status);
      }
      const data = decoded.response_data ?? [];
      return isJsonValue(data) ? data : [];
    }

    return decoded;
  }

  private url(path: string): string {
    return `${this.baseUri.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonValue {
  return Array.isArray(value) || isPlainObject(value);
}
