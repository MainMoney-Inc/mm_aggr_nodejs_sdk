/** Injectable HTTP client. */

import type { HttpResponse } from "./http-response.js";

export type RequestOptions = {
  headers?: Record<string, string>;
  json?: Record<string, unknown>;
  query?: Record<string, string | number | boolean>;
};

export interface HttpClient {
  request(method: string, uri: string, options?: RequestOptions): Promise<HttpResponse>;
}
