/**
 * Trust API Client Wrapper
 * Handles all communication with the Elephant Trust API
 */

import fetch from "node-fetch";
import {
  TrustRequest,
  TrustResponse,
  FeedbackRequest,
  FeedbackResponse,
} from "./types.js";

interface TrustAPIConfig {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  rateLimitQPS?: number;
}

interface RateLimiterState {
  requests: number[];
  lastReset: number;
}

export class TrustAPIError extends Error {
  code?: number;
  httpStatus?: number;

  constructor(message: string, code?: number, httpStatus?: number) {
    super(message);
    this.name = "TrustAPIError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export class TrustAPIClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  private timeout: number;
  private rateLimitQPS: number;
  private rateLimiter: RateLimiterState;

  constructor(config: TrustAPIConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.elephant.online/trust/";
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;
    this.timeout = config.timeout ?? 30000;
    this.rateLimitQPS = config.rateLimitQPS ?? 10;

    this.rateLimiter = {
      requests: [],
      lastReset: Date.now(),
    };
  }

  /**
   * Score a transaction for trust/fraud risk
   */
  async scoreTransaction(
    request: Partial<TrustRequest>
  ): Promise<TrustResponse> {
    const fullRequest: TrustRequest = {
      ...request,
      key: this.apiKey,
      action: request.action || { type: "purchase" },
    };

    // Validate required fields
    this.validateRequest(fullRequest);

    // Apply rate limiting
    await this.applyRateLimit();

    // Make API call with retries
    const response = await this.makeRequest<TrustResponse>(
      this.baseUrl,
      "POST",
      fullRequest
    );

    // Check for API errors in response
    if (response.error) {
      throw new TrustAPIError(response.error.message, response.error.code);
    }

    return response;
  }

  /**
   * Send feedback for previous transactions
   */
  async sendFeedback(
    request: Partial<FeedbackRequest>
  ): Promise<FeedbackResponse> {
    const fullRequest: FeedbackRequest = {
      key: this.apiKey,
      action: {
        type: "feedback",
        organization: request.action?.organization,
      },
      feedbacks: request.feedbacks || [],
    };

    // Validate feedback count
    if (fullRequest.feedbacks.length === 0) {
      throw new TrustAPIError("At least one feedback item is required");
    }

    if (fullRequest.feedbacks.length > 1000) {
      throw new TrustAPIError(
        "Maximum 1000 feedback items allowed per request",
        1023
      );
    }

    // Apply rate limiting
    await this.applyRateLimit();

    // Make API call with retries
    const response = await this.makeRequest<FeedbackResponse>(
      this.baseUrl,
      "PUT",
      fullRequest
    );

    // Check for API errors in response
    if (response.error) {
      throw new TrustAPIError(response.error.message, response.error.code);
    }

    return response;
  }

  /**
   * Build a properly structured request from flexible input
   */
  buildRequest(data: any): Partial<TrustRequest> {
    const request: Partial<TrustRequest> = {
      action: data.action || { type: "purchase" },
    };

    // Collect individual data fields
    const accountFields: any = {};
    const hasAccountGroup = data.account !== undefined;

    // Map common field names to proper structure
    const dataFields = ["name", "email", "phone", "address"];
    const otherFields = [
      "device",
      "browser",
      "card",
      "order",
      "payment",
      "session",
      "person",
      "personal_identifier",
      "locale",
      "custom",
      "page",
    ];

    // Process each field
    for (const [key, value] of Object.entries(data)) {
      if (key === "action" || key === "key") continue;

      // Skip empty/N/A values
      if (this.isEmptyValue(value)) continue;

      if (key === "sender" || key === "recipient" || key === "metadata") {
        // Handle JSON strings (some agents send JSON as strings)
        let parsedValue = value;
        if (typeof value === 'string') {
          // Try to parse as JSON (handles both valid JSON strings and Python-style dicts)
          const trimmed = value.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              // Replace Python single quotes with double quotes for JSON compatibility
              const jsonCompatible = trimmed.replace(/'/g, '"');
              parsedValue = JSON.parse(jsonCompatible);
            } catch (e) {
              // If parsing fails, use the original value
              parsedValue = value;
            }
          }
        }
        // Clean the parsed value recursively (only if it's an object)
        if (typeof parsedValue === 'object' && parsedValue !== null) {
          parsedValue = this.cleanObject(parsedValue);
        }
        if (!this.isEmptyValue(parsedValue)) {
          request[key as keyof TrustRequest] = parsedValue as any;
        }
      } else if (key === "account" || key === "billing" || key === "shipping") {
        // Use groups, but normalize their fields and clean them
        const normalized = this.normalizeGroupFields(value);
        const cleaned = this.cleanObject(normalized);
        if (!this.isEmptyValue(cleaned)) {
          request[key as keyof TrustRequest] = cleaned as any;
        }
      } else if (dataFields.includes(key) && !hasAccountGroup) {
        // If no account group exists and this is a data field, normalize and put it in account
        const normalized = this.normalizeField(key, value);
        if (!this.isEmptyValue(normalized)) {
          accountFields[key] = normalized;
        }
      } else if ([...dataFields, ...otherFields].includes(key)) {
        // For other fields, normalize and add them at the top level
        const normalized = this.normalizeField(key, value);
        if (!this.isEmptyValue(normalized)) {
          request[key as keyof TrustRequest] = normalized as any;
        }
      }
    }

    // If we collected account fields and there's no account group, create one
    if (Object.keys(accountFields).length > 0 && !hasAccountGroup) {
      request.account = accountFields;
    }

    // Set optional flags
    if (data.echo_query !== undefined) request.echo_query = data.echo_query;
    if (data.connectivity !== undefined)
      request.connectivity = data.connectivity;
    if (data.signals !== undefined) request.signals = data.signals;

    return request;
  }

  /**
   * Check if a value is empty/null/N/A and should be filtered out
   */
  private isEmptyValue(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed === '' || trimmed === 'n/a' || trimmed === 'na' || trimmed === 'null' || trimmed === 'none';
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  /**
   * Recursively clean an object, removing empty/N/A values
   */
  private cleanObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.isEmptyValue(obj) ? undefined : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item)).filter(item => !this.isEmptyValue(item));
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = this.cleanObject(value);
      if (!this.isEmptyValue(cleanedValue)) {
        cleaned[key] = cleanedValue;
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }

  /**
   * Normalize a field value to the expected structure
   */
  private normalizeField(fieldType: string, value: any): any {
    // If already an object with proper structure, return as-is
    if (typeof value === 'object' && value !== null) {
      // Check if it already has the right structure
      if (fieldType === 'email' && (value.raw || value.address)) return value;
      if (fieldType === 'phone' && (value.raw || value.number)) return value;
      if (fieldType === 'address' && (value.raw || value.country || value.city)) return value;
      if (fieldType === 'device' && (value.ip || value.fingerprint)) return value;
      // Otherwise return as-is (might be structured correctly)
      return value;
    }

    // Convert string values to proper objects
    if (typeof value === 'string') {
      switch (fieldType) {
        case 'email':
          return { raw: value };
        case 'phone':
          return { raw: value };
        case 'address':
          return { raw: value };
        case 'name':
          return { raw: value };
        case 'device':
          // Assume it's an IP address - just use the string directly
          return { ip: value };
        default:
          return value;
      }
    }

    return value;
  }

  /**
   * Normalize all fields in a group (account/billing/shipping)
   */
  private normalizeGroupFields(group: any): any {
    if (typeof group !== 'object' || group === null) return group;

    const normalized: any = {};
    for (const [key, value] of Object.entries(group)) {
      normalized[key] = this.normalizeField(key, value);
    }
    return normalized;
  }


  /**
   * Validate a request before sending
   */
  private validateRequest(request: TrustRequest): void {
    // Check for required action
    if (!request.action?.type) {
      throw new TrustAPIError("Action type is required", 2030);
    }

    // Check for at least one data field
    const dataFields = [
      "account",
      "billing",
      "shipping",
      "sender",
      "recipient",
      "name",
      "email",
      "phone",
      "address",
      "device",
      "browser",
      "card",
      "order",
      "page",
      "payment",
      "session",
      "person",
      "personal_identifier",
      "locale",
      "custom",
      "metadata",
    ];

    const hasDataField = dataFields.some(
      (field) => request[field as keyof TrustRequest] !== undefined
    );

    if (!hasDataField) {
      throw new TrustAPIError(
        "At least one data field is required (name, email, phone, address, sender, recipient, etc.)",
        2023
      );
    }

    // Validate phone objects
    this.validatePhoneObjects(request);

    // Validate address objects
    this.validateAddressObjects(request);

    // Validate name objects
    this.validateNameObjects(request);
  }

  private validatePhoneObjects(request: any): void {
    const phoneFields = [
      "phone",
      "account?.phone",
      "billing?.phone",
      "shipping?.phone",
    ];

    for (const path of phoneFields) {
      const phone = this.getNestedValue(request, path);
      if (phone) {
        if (!phone.raw && (!phone.country_code || !phone.number)) {
          throw new TrustAPIError(
            `Phone object at ${path} must have either 'raw' or both 'country_code' and 'number'`,
            1015
          );
        }
        if (phone.raw && (phone.country_code || phone.number)) {
          throw new TrustAPIError(
            `Phone object at ${path} cannot have 'raw' with other fields`,
            1024
          );
        }
      }
    }
  }

  private validateAddressObjects(request: any): void {
    const addressFields = [
      "address",
      "account?.address",
      "billing?.address",
      "shipping?.address",
    ];

    for (const path of addressFields) {
      const address = this.getNestedValue(request, path);
      if (address) {
        if (
          !address.raw &&
          !address.country &&
          !address.state &&
          !address.zip_code &&
          !address.city
        ) {
          throw new TrustAPIError(
            `Address object at ${path} must have at least one of: raw, country, state, zip_code, or city`,
            1017
          );
        }
        if (address.raw && Object.keys(address).length > 1) {
          throw new TrustAPIError(
            `Address object at ${path} cannot have 'raw' with other fields`,
            1024
          );
        }
      }
    }
  }

  private validateNameObjects(request: any): void {
    const nameFields = [
      "name",
      "account?.name",
      "billing?.name",
      "shipping?.name",
    ];

    for (const path of nameFields) {
      const name = this.getNestedValue(request, path);
      if (name) {
        if (!name.raw && (!name.first_name || !name.last_name)) {
          throw new TrustAPIError(
            `Name object at ${path} must have either 'raw' or both 'first_name' and 'last_name'`,
            2023
          );
        }
        if (name.raw && (name.first_name || name.last_name)) {
          throw new TrustAPIError(
            `Name object at ${path} cannot have 'raw' with other fields`,
            1024
          );
        }
      }
    }
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split("?.");
    let value = obj;

    for (const part of parts) {
      value = value?.[part];
      if (!value) break;
    }

    return value;
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove old requests
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      (timestamp) => timestamp > oneSecondAgo
    );

    // Check if we're at the limit
    if (this.rateLimiter.requests.length >= this.rateLimitQPS) {
      const oldestRequest = this.rateLimiter.requests[0];
      const waitTime = 1000 - (now - oldestRequest) + 10; // Add 10ms buffer

      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }

    // Add current request
    this.rateLimiter.requests.push(now);
  }

  /**
   * Make HTTP request with retries
   */
  private async makeRequest<T>(
    url: string,
    method: string,
    body: any,
    attempt = 1
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        if (attempt <= this.maxRetries) {
          const retryAfter = response.headers.get("Retry-After");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : this.retryDelay * attempt;
          await this.sleep(delay);
          return this.makeRequest<T>(url, method, body, attempt + 1);
        }
        throw new TrustAPIError("Rate limit exceeded", 1001, 429);
      }

      // Handle server errors with retry
      if (response.status >= 500 && attempt <= this.maxRetries) {
        await this.sleep(this.retryDelay * attempt);
        return this.makeRequest<T>(url, method, body, attempt + 1);
      }

      // Parse response
      const data = await response.json();

      // Check for non-200 status codes
      if (!response.ok) {
        const error = data as any;
        console.error(
          `[Trust API] Error ${response.status}:`,
          JSON.stringify(error, null, 2)
        );
        throw new TrustAPIError(
          error.message || `HTTP ${response.status}`,
          error.code,
          response.status
        );
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new TrustAPIError("Request timeout", undefined, 408);
      }

      if (error instanceof TrustAPIError) {
        throw error;
      }

      // Retry on network errors
      if (attempt <= this.maxRetries) {
        await this.sleep(this.retryDelay * attempt);
        return this.makeRequest<T>(url, method, body, attempt + 1);
      }

      throw new TrustAPIError(
        error.message || "Network error",
        undefined,
        undefined
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract insights from a trust response
   */
  analyzeResponse(response: TrustResponse): {
    riskLevel: "low" | "medium" | "high";
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskLevel: "low" | "medium" | "high" = "low";

    // Analyze overall score
    if (response.score < 300) {
      riskLevel = "high";
      issues.push("Very low trust score indicates high risk");
      recommendations.push("Manual review strongly recommended");
    } else if (response.score < 600) {
      riskLevel = "medium";
      issues.push("Moderate trust score requires attention");
      recommendations.push("Consider additional verification");
    }

    // Check for warnings
    if (response.warnings && response.warnings.length > 0) {
      issues.push(`${response.warnings.length} warning(s) in response`);
    }

    // Analyze specific signals if available
    this.analyzeFieldSignals(response, issues, recommendations);

    return { riskLevel, issues, recommendations };
  }

  private analyzeFieldSignals(
    response: any,
    issues: string[],
    recommendations: string[]
  ): void {
    // Check email signals
    const emailSignals =
      response.account?.email?.trust_signals || response.email?.trust_signals;
    if (emailSignals) {
      if (emailSignals.domain_type === "disposable") {
        issues.push("Disposable email address detected");
        recommendations.push("Require non-disposable email");
      }
      if (emailSignals.age_days === 0) {
        issues.push("Email address is new to the system");
      }
    }

    // Check phone signals
    const phoneSignals =
      response.account?.phone?.trust_signals || response.phone?.trust_signals;
    if (phoneSignals) {
      if (
        phoneSignals.line_type === "voip" &&
        phoneSignals.voip_type === "non_fixed"
      ) {
        issues.push("Non-fixed VOIP phone detected");
        recommendations.push("Consider requiring mobile or landline number");
      }
      if (phoneSignals.is_disposable) {
        issues.push("Disposable phone number detected");
      }
    }

    // Check IP signals
    const ipSignals = response.device?.ip?.trust_signals;
    if (ipSignals) {
      if (ipSignals.is_proxy || ipSignals.is_vpn) {
        issues.push("Proxy/VPN usage detected");
        recommendations.push("Consider blocking or flagging proxy/VPN users");
      }
      if (ipSignals.is_tor) {
        issues.push("TOR network detected");
        recommendations.push("High risk - manual review required");
      }
      if (ipSignals.is_bot) {
        issues.push("Bot activity detected");
        recommendations.push("Block automated traffic");
      }
    }

    // Check address validity
    const addressSignals =
      response.billing?.address?.trust_signals ||
      response.shipping?.address?.trust_signals;
    if (addressSignals) {
      if (!addressSignals.is_valid) {
        issues.push("Invalid address provided");
        recommendations.push("Verify address before processing");
      }
      if (addressSignals.is_freight_forward) {
        issues.push("Freight forwarding address detected");
        recommendations.push("Higher risk for international fraud");
      }
    }
  }
}

export default TrustAPIClient;
