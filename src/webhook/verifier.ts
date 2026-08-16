/** Verify inbound aggregator webhooks. */

import { createHmac, timingSafeEqual } from "node:crypto";

import { WebhookSignatureException } from "../errors.js";

export class WebhookVerifier {
  verify(rawBody: string, signature: string, secret: string): boolean {
    if (signature === "" || secret === "") {
      return false;
    }
    const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    const actual = signature.toLowerCase();
    if (expected.length !== actual.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(actual, "utf8"));
  }

  verifyOrFail(rawBody: string, signature: string, secret: string): void {
    if (!this.verify(rawBody, signature, secret)) {
      throw new WebhookSignatureException("Invalid X-Webhook-Signature");
    }
  }
}
