/** Default HTTP client using Node 22+ fetch. */

import { ApiException } from "../errors.js";
import type { HttpClient, RequestOptions } from "./http-client.js";
import { HttpResponse } from "./http-response.js";

export class FetchHttpClient implements HttpClient {
  private readonly timeoutMs: number;

  constructor(timeout = 30.0) {
    this.timeoutMs = timeout * 1000;
  }

  async request(method: string, uri: string, options: RequestOptions = {}): Promise<HttpResponse> {
    const headers = stringHeaders(options.headers);
    let body: string | undefined;
    const jsonBody = options.json;
    if (jsonBody !== undefined) {
      if (!isPlainObject(jsonBody)) {
        throw new ApiException("JSON body must be an object", 0);
      }
      body = JSON.stringify(jsonBody);
      headers.Accept ??= "application/json";
      headers["Content-Type"] ??= "application/json";
    }

    const url = withQuery(uri, options.query);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(this.timeoutMs),
        redirect: "manual",
      });
    } catch {
      throw new ApiException(`HTTP request failed: ${url}`, 0);
    }

    return new HttpResponse(response.status, await response.text(), multiHeaders(response.headers));
  }
}

function stringHeaders(headerBag: Record<string, string> | undefined): Record<string, string> {
  if (headerBag === undefined) {
    return {};
  }
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(headerBag)) {
    headers[name] = String(value);
  }
  return headers;
}

function withQuery(uri: string, query: RequestOptions["query"]): string {
  if (query === undefined) {
    return uri;
  }
  const entries = Object.entries(query).filter(([, value]) => value !== undefined && value !== "");
  if (entries.length === 0) {
    return uri;
  }
  const parsed = new URL(uri);
  for (const [name, value] of entries) {
    parsed.searchParams.set(name, String(value));
  }
  return parsed.toString();
}

function multiHeaders(headers: Headers): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  headers.forEach((value, name) => {
    const key = name.toLowerCase();
    result[key] ??= [];
    result[key].push(value);
  });
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
