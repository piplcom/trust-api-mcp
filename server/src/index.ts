#!/usr/bin/env node

/**
 * Trust API MCP Server
 * Exposes Trust API functionality through the Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ScoreTransactionTool,
  SendFeedbackTool,
  AnalyzeTrustResponseTool,
  CheckConnectivityTool,
  ValidateRequestTool,
  GetFieldSignalsTool,
  initializeToolDependencies,
} from './tools.js';
import {
  FieldSchemasResource,
  ExampleRequestsResource,
  ErrorCodesResource,
  TrustSignalsResource,
  ReasonCodesResource,
} from './resources.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const API_KEY = process.env.TRUST_API_KEY;
const API_URL = process.env.TRUST_API_URL;
const SERVER_NAME = 'trust-api-mcp';
const SERVER_VERSION = '1.0.0';

// Validate configuration
if (!API_KEY) {
  console.error('ERROR: TRUST_API_KEY environment variable is required');
  console.error('Please set TRUST_API_KEY in your .env file or environment');
  process.exit(1);
}

// Initialize tool dependencies
initializeToolDependencies(API_KEY, { baseUrl: API_URL });

// Create tools and resources
const tools = [
  new ScoreTransactionTool(),
  new SendFeedbackTool(),
  new AnalyzeTrustResponseTool(),
  new CheckConnectivityTool(),
  new ValidateRequestTool(),
  new GetFieldSignalsTool(),
];

const resources = [
  new FieldSchemasResource(),
  new ExampleRequestsResource(),
  new ErrorCodesResource(),
  new TrustSignalsResource(),
  new ReasonCodesResource(),
];

// Create MCP server
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Handle tool listing
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => tool.toolDefinition),
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  const tool = tools.find(t => t.name === name);

  if (!tool) {
    throw new Error(`Tool '${name}' not found`);
  }

  return await tool.toolCall(request);
});

/**
 * Handle resource listing
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources.map(resource => resource.resourceDefinition),
  };
});

/**
 * Handle resource reading
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const resource = resources.find(r => r.uri === uri);

  if (!resource) {
    throw new Error(`Resource '${uri}' not found`);
  }

  const contents = await resource.read();
  return { contents };
});

/**
 * Start the server
 */
async function main() {
  // Log to stderr so it doesn't interfere with stdio JSON-RPC communication
  console.error(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);
  console.error('Configuration:');
  console.error(`  API URL: ${API_URL || 'https://api.elephant.online/trust/'}`);
  console.error(`  API Key: ${API_KEY?.substring(0, 8)}...`);
  console.error('');
  console.error(`Available tools: ${tools.length}`);
  tools.forEach(tool => {
    console.error(`  - ${tool.name}: ${tool.description.substring(0, 60)}...`);
  });
  console.error('');
  console.error(`Available resources: ${resources.length}`);
  resources.forEach(resource => {
    console.error(`  - ${resource.uri}: ${resource.name}`);
  });
  console.error('');
  console.error('Server ready for connections via stdio');

  // Set up transport
  const transport = new StdioServerTransport();

  // Handle errors
  server.onerror = (error) => {
    console.error('Server error:', error);
  };

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('\nShutting down server...');
    await server.close();
    process.exit(0);
  });

  // Connect and start
  await server.connect(transport);
}

// Run the server
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
