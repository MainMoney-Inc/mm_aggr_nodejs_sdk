/** Queued HTTP test double that records requests. */

import type { HttpClient, RequestOptions } from "../src/http/http-client.js";
import type { HttpResponse } from "../src/http/http-response.js";

export class MockHttpClient implements HttpClient {
  private readonly queue: HttpResponse[] = [];
  readonly history: Array<{ method: string; uri: string; options: RequestOptions }> = [];

  enqueue(...responses: HttpResponse[]): void {
    this.queue.push(...responses);
  }

  async request(method: string, uri: string, options: RequestOptions = {}): Promise<HttpResponse> {
    this.history.push({ method, uri, options });
    const next = this.queue.shift();
    if (next === undefined) {
      throw new Error("MockHttpClient queue is empty");
    }
    return next;
  }
}
