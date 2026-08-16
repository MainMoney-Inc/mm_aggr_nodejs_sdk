/** HTTP response value object. */

export class HttpResponse {
  readonly statusCode: number;
  readonly body: string;
  readonly headers: Record<string, string[]>;

  constructor(statusCode: number, body: string, headers: Record<string, string[]> = {}) {
    this.statusCode = statusCode;
    this.body = body;
    this.headers = headers;
  }
}
