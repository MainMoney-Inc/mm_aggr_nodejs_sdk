/** Exceptions raised by the MainMoney aggregator SDK. */

export class AggregatorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AggregatorException";
  }
}

export class AuthenticationException extends AggregatorException {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationException";
  }
}

export class WebhookSignatureException extends AggregatorException {
  constructor(message: string) {
    super(message);
    this.name = "WebhookSignatureException";
  }
}

export class ApiException extends AggregatorException {
  readonly statusCode: number;
  readonly errors: Record<string, unknown>;
  readonly responseBody: unknown;

  constructor(
    message: string,
    statusCode: number,
    errors: Record<string, unknown> = {},
    responseBody: unknown = null,
  ) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
    this.errors = errors;
    this.responseBody = responseBody;
  }

  static fromEnvelope(envelope: Record<string, unknown>, statusCode: number): ApiException {
    const message =
      typeof envelope.message === "string" ? envelope.message : "Aggregator request failed";
    const responseData = envelope.response_data ?? {};
    let errors: Record<string, unknown> = {};
    if (isPlainObject(responseData)) {
      const rawErrors = responseData.errors;
      if (isPlainObject(rawErrors)) {
        errors = rawErrors;
      }
    }
    return new ApiException(message, statusCode, errors, envelope);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
