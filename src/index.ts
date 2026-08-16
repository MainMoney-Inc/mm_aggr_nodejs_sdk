export interface AggregatorClientOptions {
  baseUri: string;
  apiKey: string;
}

export class AggregatorClient {
  readonly baseUri: string;

  constructor(options: AggregatorClientOptions) {
    this.baseUri = options.baseUri;
  }
}
