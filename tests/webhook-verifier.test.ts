import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { WebhookSignatureException } from "../src/errors.js";
import { WebhookVerifier } from "../src/webhook/verifier.js";

describe("WebhookVerifier", () => {
  it("accepts python canonical JSON HMAC", () => {
    // json.dumps(payload, separators=(",", ":"), sort_keys=True)
    const rawBody =
      '{"amount":"100.00","currency":"KES","merchant_reference":"ORDER-123","type":"DEPOSIT"}';
    const secret = "whsec_test";
    const signature = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

    const verifier = new WebhookVerifier();
    expect(verifier.verify(rawBody, signature, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const rawBody = '{"amount":"100.00","currency":"KES"}';
    const secret = "whsec_test";
    const signature = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

    const verifier = new WebhookVerifier();
    expect(verifier.verify('{"amount":"999.00","currency":"KES"}', signature, secret)).toBe(false);
  });

  it("verifyOrFail throws", () => {
    expect(() => new WebhookVerifier().verifyOrFail("{}", "deadbeef", "secret")).toThrow(
      WebhookSignatureException,
    );
  });
});
