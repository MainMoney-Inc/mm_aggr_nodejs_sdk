import { Client } from "@mainmoney/sdk";

export function getClient(): Client {
  return new Client({
    clientId: process.env.MM_CLIENT_ID ?? "",
    secret: process.env.MM_API_SECRET ?? "",
    baseUri: process.env.MM_BASE_URI || undefined,
    test: ["1", "true", "yes"].includes((process.env.MM_TEST ?? "true").toLowerCase()),
  });
}
