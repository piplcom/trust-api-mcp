import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";
import { client, validator } from "./dependencies.js";

const ScoreTransactionSchema = z.object({
  action: z
    .object({
      type: z
        .enum(["signup", "purchase"])
        .or(z.string())
        .describe("Action type"),
      id: z
        .string()
        .optional()
        .describe("Your internal ID for this action"),
      organization: z
        .string()
        .optional()
        .describe("Organization name if using multiple orgs"),
    })
    .describe("Action being scored"),
  account: z
    .any()
    .optional()
    .describe("Account information (name, email, phone, address, etc)"),
  billing: z
    .any()
    .optional()
    .describe("Billing information for purchases"),
  shipping: z
    .any()
    .optional()
    .describe("Shipping information for purchases"),
  name: z.any().optional().describe("Name object if not in a group"),
  email: z.any().optional().describe("Email object if not in a group"),
  phone: z.any().optional().describe("Phone object if not in a group"),
  address: z
    .any()
    .optional()
    .describe("Address object if not in a group"),
  device: z.any().optional().describe("Device/IP information"),
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
  history: z
    .boolean()
    .optional()
    .default(false)
    .describe("Historical query (free, no scores)"),
});

export default class ScoreTransactionTool extends MCPTool {
  name = "score_transaction";
  description = "Score a transaction or user action for trust/fraud risk. Returns a score 0-1000 and decision (approve/review/decline).";
  protected schema = ScoreTransactionSchema;

  async execute(input: MCPInput<this>) {
    const request = client.buildRequest(input);
    const validation = validator.validateRequest(request);

    if (!validation.valid) {
      return JSON.stringify({
        success: false,
        validation,
        message: "Request validation failed",
      }, null, 2);
    }

    try {
      const response = await client.scoreTransaction(request);
      const analysis = client.analyzeResponse(response);

      return JSON.stringify({
        success: true,
        response,
        analysis,
        validation: validation.warnings.length > 0 ? validation : undefined,
      }, null, 2);
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          httpStatus: error.httpStatus,
        },
      }, null, 2);
    }
  }
}
