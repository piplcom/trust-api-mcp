# Email Security Agent (Pydantic AI + MCP)

An intelligent Python agent that uses Pydantic AI with the Trust API MCP server to analyze email security threats and detect phishing, spoofing, and suspicious activity.

## How It Works

The agent follows this autonomous flow:

```
Email Metadata Input
         ↓
  [Pydantic AI Agent]
         ↓
  Auto-discover MCP tools ← [Trust API MCP Server]
         ↓
  Autonomously call score_transaction (action: email_security)
         ↓
  Analyze trust scores + email authentication
         ↓
  Apply email security logic
         ↓
  Make decision: SAFE/SUSPICIOUS/BLOCK
         ↓
  Return structured decision + reasoning
```

## Features

- **Autonomous Tool Discovery**: Agent automatically discovers and uses MCP tools
- **Email Security Analysis**: Analyzes sender/recipient trust, email authentication (DKIM/SPF/DMARC)
- **Phishing Detection**: Identifies domain spoofing, authentication failures, and mismatches
- **Risk Classification**: Categorizes emails into very_low, low, medium, high, very_high risk
- **Confidence Scoring**: Provides confidence level (0-1) for each decision
- **Risk Factor Analysis**: Identifies specific threats (disposable email, VPN, TOR, malicious IPs)
- **Actionable Recommendations**: Suggests next steps (deliver, quarantine, block)

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Make sure the MCP server is built
cd ../server
npm install
npm run build
cd ../agent
```

## Environment Setup

Create a `.env` file in the `agent/` directory:

```bash
# Required: OpenAI API key for Pydantic AI
OPENAI_API_KEY=sk-...

# Required: Trust API key (also set in ../server/.env)
TRUST_API_KEY=your_trust_api_key_here
```

Get your Trust API key from: https://app.elephant.online/organization/keys

## Usage

### Basic Usage

```python
from email_security_agent import EmailAnalysisRequest, analyze_email_security, email_security_agent

async def check_email():
    async with email_security_agent:
        request = EmailAnalysisRequest(
            sender_email="user@example.com",
            sender_name="John Doe",
            sender_ip="8.8.8.8",
            recipient_email="support@company.com",
            recipient_name="Support Team",
            arc_authentication_results="mx.google.com; dkim=pass; spf=pass; dmarc=pass",
            dkim_signature="v=1; a=rsa-sha256; d=example.com; s=google;",
            message_id_domain="example.com",
        )

        decision = await analyze_email_security(request)
        print(f"Decision: {decision.decision}")
        print(f"Risk: {decision.risk_level}")
        print(f"Reasoning: {decision.reasoning}")
```

### Run Examples

```bash
# Make sure OPENAI_API_KEY and TRUST_API_KEY are set
python email_security_agent.py
```

## Decision Logic

The agent uses the following security rules:

| Score Range | Decision | Risk Level | Action |
|------------|----------|------------|---------|
| 800-1000 | SAFE | very_low | Deliver to inbox |
| 600-799 | SAFE | low | Deliver with monitoring |
| 400-599 | SUSPICIOUS | medium | Flag for review or quarantine |
| 200-399 | BLOCK | high | Likely phishing/spam - block |
| 0-199 | BLOCK | very_high | Block immediately |

### Email Security Risk Factors

Critical factors that can trigger BLOCK or SUSPICIOUS:

- **Email Authentication Failures**: DKIM, SPF, or DMARC failures
- **Domain Mismatches**: Sender domain ≠ Message-ID domain
- **Disposable Emails**: Temporary/disposable email domains
- **Network Risks**: VPN/Proxy/TOR usage from sender IP
- **New Accounts**: Brand new email accounts (0 days old)
- **Malicious IPs**: Known bad IP addresses
- **Domain Reputation**: Poor sender domain reputation
- **Suspicious Patterns**: Anomalous sender/recipient behavior

## Example Output

```
╔══════════════════════════════════════════════════════════════════╗
║      Email Security Agent (Pydantic AI + MCP - PROPER)          ║
║          Agent autonomously discovers and uses MCP tools         ║
╚══════════════════════════════════════════════════════════════════╝

🔍 Agent is discovering available MCP tools...
✅ Agent ready! It will autonomously decide which tools to use.

======================================================================
EXAMPLE 1: Analyzing Legitimate Email (Gmail to Corporate)
======================================================================

======================================================================
✅ EMAIL SECURITY ANALYSIS (Autonomous Agent)
======================================================================

📧 Sender: yuri1992@gmail.com (Yuri Ritvin)
🌐 Sender IP: 8.8.8.8

📧 Recipient: moshee@pipl.com (Moshe Elkayam)
🌐 Recipient IP: 1.1.1.1

🔐 Authentication: DKIM/SPF/DMARC all pass

📊 Trust Score: 750/1000

✅ Decision: SAFE
🟡 Risk Level: LOW
🎯 Confidence: 88%

💭 Reasoning:
   Legitimate Gmail user with passing authentication. No suspicious patterns detected.

💡 Recommendations:
   1. Deliver to inbox
   2. Monitor for unusual activity patterns
   3. No additional action required

======================================================================
```

## Advanced Usage

### Custom Email Security Rules

You can extend the agent's behavior by modifying the system prompt:

```python
from pydantic_ai import Agent

custom_agent = Agent(
    model="openai:gpt-4o",
    output_type=EmailSecurityDecision,
    system_prompt="""Your custom email security rules here...

    Additional requirements:
    - Block all emails from @tempmail.com
    - Require MFA for high-value recipients
    - etc.
    """,
    toolsets=[trust_api_server],
)
```

### Batch Email Analysis

```python
async def analyze_email_batch(emails: list[EmailAnalysisRequest]):
    async with email_security_agent:
        results = []
        for email in emails:
            decision = await analyze_email_security(email)
            results.append({
                "email": email.sender_email,
                "decision": decision.decision,
                "risk": decision.risk_level,
            })
        return results
```

## Architecture

- **EmailAnalysisRequest**: Input model with sender, recipient, and authentication metadata
- **EmailSecurityDecision**: Structured output with decision, risk, confidence, and reasoning
- **email_security_agent**: Pydantic AI agent that autonomously discovers and uses MCP tools
- **trust_api_server**: MCP connection to Trust API server (stdio transport)
- **analyze_email_security()**: Main function that runs the agent with email context

## How the Agent Works

1. **MCP Connection**: Agent connects to Trust API MCP server via stdio
2. **Tool Discovery**: Agent automatically discovers available tools (`score_transaction`, etc.)
3. **Autonomous Analysis**: Agent reads the email metadata and decides which tools to call
4. **Trust Scoring**: Calls `score_transaction` with `action_type="email_security"`
5. **Authentication Check**: Analyzes DKIM/SPF/DMARC headers and domain matches
6. **Risk Assessment**: Combines trust scores with email-specific risk factors
7. **Decision Making**: Returns structured decision with reasoning and recommendations

## Requirements

- Python 3.10+
- Node.js 18+ (for MCP server)
- OpenAI API key (for Pydantic AI)
- Trust API key (set in `../server/.env`)

## Dependencies

- `pydantic-ai>=0.0.14` - AI agent framework with structured outputs
- `pydantic>=2.0.0` - Data validation
- `openai>=1.0.0` - OpenAI API client
- `mcp>=1.0.0` - Model Context Protocol
- `python-dotenv>=1.0.0` - Environment variable management

## License

MIT
