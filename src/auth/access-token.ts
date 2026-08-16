/** Cached access token from POST /auth/tokens/exchange/. */

export class AccessToken {
  constructor(
    readonly accessToken: string,
    readonly tokenType: string,
    readonly expiresIn: number,
    readonly expiresAt: Date,
  ) {}

  isExpiring(skewSeconds = 60): boolean {
    const threshold = this.expiresAt.getTime() - skewSeconds * 1000;
    return Date.now() >= threshold;
  }
}
