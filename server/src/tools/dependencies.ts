/**
 * Shared dependencies for all tools
 */

import { TrustAPIClient } from "../trust-api.js";
import { RequestValidator } from "../validators.js";

export let client: TrustAPIClient;
export let validator: RequestValidator;

export function initializeToolDependencies(apiKey: string, config?: { baseUrl?: string }) {
  client = new TrustAPIClient({ apiKey, baseUrl: config?.baseUrl });
  validator = new RequestValidator();
}
