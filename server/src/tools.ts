/**
 * MCP Tool Implementations using mcp-framework
 * All tools for interacting with the Trust API
 */

import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";
import { TrustAPIClient } from "./trust-api.js";
import { RequestValidator } from "./validators.js";
import { TrustResponse, FeedbackRequest } from "./types.js";

// Shared client and validator (will be initialized by ToolProvider)
let client: TrustAPIClient;
let validator: RequestValidator;

export function initializeToolDependencies(
  apiKey: string,
  config?: { baseUrl?: string }
) {
  client = new TrustAPIClient({ apiKey, baseUrl: config?.baseUrl });
  validator = new RequestValidator();
}

/**
 * Score Transaction Tool
 */
const ScoreTransactionSchema = z.object({
  action: z
    .object({
      type: z
        .enum(["signup", "purchase", "email_security"])
        .or(z.string())
        .describe("Action type"),
      id: z.string().optional().describe("Your internal ID for this action"),
      organization: z
        .string()
        .optional()
        .describe("Organization name if using multiple orgs"),
    })
    .describe("Action being scored"),
  // Sender/Recipient groups for email security
  sender: z
    .any()
    .optional()
    .describe("Sender info: {email: 'user@example.com', name: 'John Doe', ip: '1.2.3.4'}"),
  recipient: z
    .any()
    .optional()
    .describe("Recipient info: {email: 'user@example.com', name: 'John Doe', ip: '1.2.3.4'}"),

  // Metadata for email authentication headers
  metadata: z
    .any()
    .optional()
    .describe("Email metadata: {'arc-authentication-results': '...', 'dkim-signature': '...', 'message_id_domain': '...'}"),

  // Standard fields - can be strings (auto-converted) or objects
  account: z
    .any()
    .optional()
    .describe("Account information. Strings auto-convert: email='user@example.com' becomes {raw: 'user@example.com'}"),
  billing: z.any().optional().describe("Billing information for purchases"),
  shipping: z.any().optional().describe("Shipping information for purchases"),
  name: z.any().optional().describe("Name: string 'John Doe' OR {raw: 'John Doe'} OR {first_name: 'John', last_name: 'Doe'}"),
  email: z.any().optional().describe("Email: string 'user@example.com' OR {raw: 'user@example.com'}"),
  phone: z.any().optional().describe("Phone: string '+1234567890' OR {raw: '+1234567890'}"),
  address: z.any().optional().describe("Address: string OR {raw: 'address'} OR structured fields"),
  device: z.any().optional().describe("Device: IP string '1.2.3.4' OR {ip: {raw: '1.2.3.4'}}"),
  browser: z.any().optional().describe("Browser information"),
  card: z.any().optional().describe("Payment card information"),
  order: z.any().optional().describe("Order details"),
  payment: z.any().optional().describe("Payment method"),
  person: z.any().optional().describe("Personal info (DOB, gender)"),
  personal_identifier: z
    .any()
    .optional()
    .describe("Government ID (CPF, SSN, etc)"),
  session: z.any().optional().describe("Session information"),
  locale: z.any().optional().describe("Location/region info"),
  custom: z.any().optional().describe("Custom fields"),
  echo_query: z
    .boolean()
    .optional()
    .default(true)
    .describe("Echo input in response"),
  connectivity: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include connectivity scores"),
  signals: z
    .boolean()
    .optional()
    .default(true)
    .describe("Include trust signals"),
});

export class ScoreTransactionTool extends MCPTool {
  name = "score_transaction";
  description =
    "Score a transaction or user action for trust/fraud risk. Returns a score 0-1000 and decision (approve/review/decline).";
  schema = ScoreTransactionSchema;

  async execute(input: MCPInput<this>) {
    const request = client.buildRequest(input);
    console.error('[score_transaction] Sending request:', JSON.stringify(request, null, 2));

    try {
      const response = await client.scoreTransaction(request);
      const analysis = client.analyzeResponse(response);

      return JSON.stringify(
        {
          success: true,
          response,
          analysis,
        },
        null,
        2
      );
    } catch (error: any) {
      console.error('[score_transaction] Error:', error);
      return JSON.stringify(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            httpStatus: error.httpStatus,
          },
        },
        null,
        2
      );
    }
  }
}

/**
 * Send Feedback Tool
 */
const SendFeedbackSchema = z.object({
  feedbacks: z
    .array(
      z.object({
        id: z
          .string()
          .describe("Response ID or Action ID from original transaction"),
        type: z
          .enum(["response_id", "action_id"])
          .describe("Type of ID provided"),
        feedback_code: z
          .union([z.literal(1001), z.literal(1002)])
          .describe("1001=approved, 1002=declined"),
        reason_codes: z
          .array(z.number())
          .optional()
          .describe("Reason codes (3000-4004)"),
        reason_text: z.string().optional().describe("Free text explanation"),
        feedback_timestamp: z
          .string()
          .optional()
          .describe("Timestamp in epoch format"),
      })
    )
    .min(1)
    .max(1000)
    .describe("Feedback items (1-1000)"),
  organization: z
    .string()
    .optional()
    .describe("Organization name if using multiple orgs"),
});

export class SendFeedbackTool extends MCPTool {
  name = "send_feedback";
  description =
    "Send feedback about transaction outcomes to improve scoring. Max 1000 items per request.";
  schema = SendFeedbackSchema;

  async execute(input: MCPInput<this>) {
    const request: Partial<FeedbackRequest> = {
      action: {
        type: "feedback",
        organization: input.organization,
      },
      feedbacks: input.feedbacks,
    };

    try {
      const response = await client.sendFeedback(request);
      const summary = {
        total: response.feedbacks.length,
        received: response.feedbacks.filter((f) => f.received).length,
        failed: response.feedbacks.filter((f) => !f.received).length,
      };

      return JSON.stringify(
        {
          success: true,
          response,
          summary,
        },
        null,
        2
      );
    } catch (error: any) {
      return JSON.stringify(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
            httpStatus: error.httpStatus,
          },
        },
        null,
        2
      );
    }
  }
}

/**
 * Analyze Trust Response Tool
 */
const AnalyzeTrustResponseSchema = z.object({
  response: z.any().describe("Trust API response to analyze"),
  includeConnectivity: z
    .boolean()
    .optional()
    .default(true)
    .describe("Analyze connectivity scores"),
  includeSignals: z
    .boolean()
    .optional()
    .default(true)
    .describe("Analyze trust signals"),
});

export class AnalyzeTrustResponseTool extends MCPTool {
  name = "analyze_trust_response";
  description =
    "Analyze and explain a Trust API response, extracting key insights and recommendations.";
  schema = AnalyzeTrustResponseSchema;

  async execute(input: MCPInput<this>) {
    const response = input.response as TrustResponse;
    const insights: any = {
      summary: {
        score: response.score,
        decision: response.decision,
        riskLevel: getRiskLevel(response.score),
        responseId: response.response_id,
      },
      issues: [],
      recommendations: [],
      fieldAnalysis: {},
    };

    if (response.score < 300) {
      insights.issues.push("Very low trust score - high fraud risk");
      insights.recommendations.push("Manual review required");
    } else if (response.score < 600) {
      insights.issues.push("Moderate trust score - some risk indicators");
      insights.recommendations.push("Consider additional verification");
    }

    if (response.warnings && response.warnings.length > 0) {
      insights.warnings = response.warnings;
      insights.issues.push(`${response.warnings.length} warning(s) detected`);
    }

    if (input.includeSignals) {
      analyzeSignals(response, insights);
    }

    if (input.includeConnectivity) {
      analyzeConnectivity(response, insights);
    }

    return JSON.stringify(insights, null, 2);
  }
}

/**
 * Check Connectivity Tool
 */
const CheckConnectivitySchema = z.object({
  response: z.any().describe("Trust API response with connectivity data"),
  threshold: z
    .number()
    .optional()
    .default(60)
    .describe("Minimum score for good connectivity"),
});

export class CheckConnectivityTool extends MCPTool {
  name = "check_connectivity";
  description = "Analyze connectivity between identity elements in a response.";
  schema = CheckConnectivitySchema;

  async execute(input: MCPInput<this>) {
    const response = input.response;
    const threshold = input.threshold;
    const connections: any[] = [];
    const issues: string[] = [];

    extractConnectivity(response, "", connections);

    const strongConnections = connections.filter((c) => c.score >= 80);
    const moderateConnections = connections.filter(
      (c) => c.score >= threshold && c.score < 80
    );
    const weakConnections = connections.filter(
      (c) => c.score < threshold && c.score !== null
    );
    const noData = connections.filter((c) => c.score === null);

    if (weakConnections.length > 0) {
      weakConnections.forEach((c) => {
        issues.push(
          `Weak connection between ${c.from} and ${c.to} (score: ${c.score})`
        );
      });
    }

    const billingShippingMismatch = connections.find(
      (c) =>
        c.from.includes("billing") &&
        c.to.includes("shipping") &&
        c.score < threshold
    );
    if (billingShippingMismatch) {
      issues.push("Billing and shipping addresses appear unrelated");
    }

    return JSON.stringify(
      {
        summary: {
          total: connections.length,
          strong: strongConnections.length,
          moderate: moderateConnections.length,
          weak: weakConnections.length,
          noData: noData.length,
        },
        connections,
        issues,
        recommendations: getConnectivityRecommendations(issues),
      },
      null,
      2
    );
  }
}

/**
 * Validate Request Tool
 */
const ValidateRequestSchema = z.object({
  request: z.any().describe("Request data to validate"),
});

export class ValidateRequestTool extends MCPTool {
  name = "validate_request";
  description = "Validate a Trust API request before sending it.";
  schema = ValidateRequestSchema;

  async execute(input: MCPInput<this>) {
    const request = client.buildRequest(input.request);
    const validation = validator.validateRequest(request);

    return JSON.stringify(
      {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        summary: {
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length,
          status: validation.valid ? "ready" : "needs_fixes",
        },
        recommendations: getValidationRecommendations(validation),
      },
      null,
      2
    );
  }
}

/**
 * Get Field Signals Tool
 */
const GetFieldSignalsSchema = z.object({
  response: z.any().describe("Trust API response"),
  field: z
    .string()
    .describe('Field to analyze (e.g., "account.email", "device.ip")'),
});

export class GetFieldSignalsTool extends MCPTool {
  name = "get_field_signals";
  description =
    "Extract and explain trust signals for specific fields in a response.";
  schema = GetFieldSignalsSchema;

  async execute(input: MCPInput<this>) {
    const response = input.response;
    const fieldPath = input.field;

    const fieldData = navigateToField(response, fieldPath);

    if (!fieldData) {
      return JSON.stringify(
        {
          success: false,
          message: `Field ${fieldPath} not found in response`,
        },
        null,
        2
      );
    }

    const result: any = {
      field: fieldPath,
      data: fieldData,
    };

    if (fieldData.score !== undefined) {
      result.score = {
        value: fieldData.score,
        interpretation: interpretScore(fieldData.score),
      };
    }

    if (fieldData.trust_signals) {
      result.signals = explainSignals(fieldData.trust_signals, fieldPath);
    }

    if (fieldData.connectivity_data) {
      result.connectivity = formatConnectivity(fieldData.connectivity_data);
    }

    if (fieldData.distance) {
      result.distance = fieldData.distance;
    }

    return JSON.stringify(result, null, 2);
  }
}

// Helper functions
function getRiskLevel(score: number): string {
  if (score >= 800) return "very_low";
  if (score >= 600) return "low";
  if (score >= 400) return "medium";
  if (score >= 200) return "high";
  return "very_high";
}

function analyzeSignals(response: any, insights: any) {
  const emailPaths = [
    "email",
    "account.email",
    "billing.email",
    "shipping.email",
  ];
  for (const path of emailPaths) {
    const emailData = navigateToField(response, path);
    if (emailData?.trust_signals) {
      const signals = emailData.trust_signals;
      const fieldInsights: string[] = [];

      if (signals.domain_type === "disposable") {
        fieldInsights.push("Disposable email detected");
        insights.issues.push(`${path}: Disposable email domain`);
      }
      if (signals.age_days === 0) {
        fieldInsights.push("Brand new email");
      }
      if (signals.velocity > 100) {
        fieldInsights.push("High usage velocity");
      }

      if (fieldInsights.length > 0) {
        insights.fieldAnalysis[path] = fieldInsights;
      }
    }
  }

  const phonePaths = [
    "phone",
    "account.phone",
    "billing.phone",
    "shipping.phone",
  ];
  for (const path of phonePaths) {
    const phoneData = navigateToField(response, path);
    if (phoneData?.trust_signals) {
      const signals = phoneData.trust_signals;
      const fieldInsights: string[] = [];

      if (signals.line_type === "voip" && signals.voip_type === "non_fixed") {
        fieldInsights.push("Non-fixed VOIP phone");
        insights.issues.push(`${path}: Non-fixed VOIP detected`);
      }
      if (signals.is_disposable) {
        fieldInsights.push("Disposable phone number");
        insights.issues.push(`${path}: Disposable phone`);
      }

      if (fieldInsights.length > 0) {
        insights.fieldAnalysis[path] = fieldInsights;
      }
    }
  }

  if (response.device?.ip?.trust_signals) {
    const signals = response.device.ip.trust_signals;
    const ipInsights: string[] = [];

    if (signals.is_proxy || signals.is_vpn) {
      ipInsights.push("Proxy/VPN detected");
      insights.issues.push("IP: Proxy or VPN usage");
    }
    if (signals.is_tor) {
      ipInsights.push("TOR network");
      insights.issues.push("IP: TOR network detected - very high risk");
    }
    if (signals.is_bot) {
      ipInsights.push("Bot activity");
      insights.issues.push("IP: Bot/automated traffic");
    }

    if (ipInsights.length > 0) {
      insights.fieldAnalysis["device.ip"] = ipInsights;
    }
  }
}

function analyzeConnectivity(response: any, insights: any) {
  const connections: any[] = [];
  extractConnectivity(response, "", connections);

  const weakConnections = connections.filter(
    (c) => c.score < 60 && c.score !== null
  );
  if (weakConnections.length > 0) {
    insights.connectivityIssues = weakConnections.map((c) => ({
      from: c.from,
      to: c.to,
      score: c.score,
      match: c.match,
    }));

    weakConnections.forEach((c) => {
      insights.issues.push(
        `Weak connectivity: ${c.from} ↔ ${c.to} (${c.score})`
      );
    });
  }
}

function extractConnectivity(obj: any, path: string, connections: any[]) {
  if (!obj || typeof obj !== "object") return;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (key === "connectivity_data" && value) {
      extractConnectivityScores(value, path, connections);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      extractConnectivity(value, currentPath, connections);
    }
  }
}

function extractConnectivityScores(
  connectivityData: any,
  fromPath: string,
  connections: any[]
) {
  for (const [group, fields] of Object.entries(connectivityData)) {
    if (typeof fields === "object") {
      for (const [field, data] of Object.entries(fields as any)) {
        if (data && typeof data === "object" && "score" in data) {
          connections.push({
            from: fromPath,
            to: `${group}.${field}`,
            score: (data as any).score,
            match: (data as any).match,
          });
        }
      }
    }
  }
}

function navigateToField(obj: any, path: string): any {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object") return null;
    current = current[part];
  }

  return current;
}

function interpretScore(score: number): string {
  if (score >= 800) return "Very trustworthy";
  if (score >= 600) return "Moderately trustworthy";
  if (score >= 400) return "Neutral/unknown";
  if (score >= 200) return "Somewhat risky";
  return "High risk";
}

function explainSignals(signals: any, fieldPath: string): any {
  const explanations: any = {};

  if (fieldPath.includes("email")) {
    if (signals.is_valid !== undefined) {
      explanations.is_valid = signals.is_valid
        ? "Valid email format"
        : "Invalid email format";
    }
    if (signals.domain_type) {
      explanations.domain_type = `Email domain type: ${signals.domain_type}`;
    }
    if (signals.age_days !== undefined) {
      explanations.age = `Email age: ${signals.age_days} days`;
    }
  } else if (fieldPath.includes("phone")) {
    if (signals.line_type) {
      explanations.line_type = `Phone type: ${signals.line_type}`;
    }
    if (signals.is_disposable !== undefined) {
      explanations.is_disposable = signals.is_disposable
        ? "Disposable phone detected"
        : "Not disposable";
    }
  } else if (fieldPath.includes("ip")) {
    if (signals.is_proxy !== undefined) {
      explanations.is_proxy = signals.is_proxy
        ? "Proxy detected"
        : "Not a proxy";
    }
    if (signals.is_vpn !== undefined) {
      explanations.is_vpn = signals.is_vpn ? "VPN detected" : "Not a VPN";
    }
    if (signals.country_code) {
      explanations.country = `IP location: ${signals.country_code}`;
    }
  }

  return {
    raw: signals,
    explanations,
  };
}

function formatConnectivity(connectivityData: any): any {
  const formatted: any[] = [];

  for (const [group, fields] of Object.entries(connectivityData)) {
    if (typeof fields === "object") {
      for (const [field, data] of Object.entries(fields as any)) {
        if (data && typeof data === "object" && "score" in data) {
          formatted.push({
            to: `${group}.${field}`,
            score: (data as any).score,
            match: (data as any).match,
            interpretation: interpretConnectivityScore((data as any).score),
          });
        }
      }
    }
  }

  return formatted;
}

function interpretConnectivityScore(score: number | null): string {
  if (score === null) return "No data available";
  if (score >= 80) return "Strong connection";
  if (score >= 60) return "Moderate connection";
  if (score >= 40) return "Weak connection";
  return "Very weak or no connection";
}

function getConnectivityRecommendations(issues: string[]): string[] {
  const recommendations: string[] = [];

  if (issues.some((i) => i.includes("billing") && i.includes("shipping"))) {
    recommendations.push("Verify billing and shipping addresses independently");
    recommendations.push("Consider requiring phone verification");
  }

  if (issues.length > 3) {
    recommendations.push(
      "Multiple connectivity issues - recommend manual review"
    );
  }

  return recommendations;
}

function getValidationRecommendations(validation: any): string[] {
  const recommendations: string[] = [];

  for (const error of validation.errors) {
    if (error.code === 1015 || error.code === 2023) {
      recommendations.push(`Add missing required fields for ${error.field}`);
    } else if (error.code === 1024) {
      recommendations.push(
        `Use either raw OR parsed fields for ${error.field}, not both`
      );
    }
  }

  for (const warning of validation.warnings) {
    if (warning.field.includes("country") || warning.field.includes("state")) {
      recommendations.push("Use ISO codes for countries and states");
    }
  }

  return recommendations;
}
