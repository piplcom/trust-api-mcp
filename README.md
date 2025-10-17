# Trust API MCP

Model Context Protocol (MCP) server for Elephant Trust API fraud detection and identity verification.

## Quick Start

### MCP Server

1. Navigate to server directory and copy environment example:
   ```bash
   cd server
   cp env.example .env
   ```

2. Add your Trust API key to `.env`:
   ```
   TRUST_API_KEY=your-trust-api-key-here
   ```
   Get your API key from: https://app.elephant.online/organization/keys

3. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

4. Run the server:
   ```bash
   npm start
   ```

### Agent

1. Navigate to agent directory and copy environment example:
   ```bash
   cd agent
   cp .env.example .env
   ```

2. Add your API keys to `.env`:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   TRUST_API_KEY=your-trust-api-key-here
   ```
   - OpenAI key from: https://platform.openai.com/api-keys
   - Trust API key from: https://app.elephant.online/organization/keys

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the email security agent:
   ```bash
   python email_security_agent.py
   ```

## Requirements

- Node.js >= 18.0.0
- Python 3.x
- Trust API key from Elephant
