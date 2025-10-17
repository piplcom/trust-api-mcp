# Trust API Agentic Flow

A simple Python agent that uses the Trust API MCP server to make intelligent fraud detection decisions based on email and IP addresses.

## How It Works

The agent follows this flow:

```
User Input (email + IP)
         ↓
  [Trust Agent]
         ↓
  Connect to MCP Server ← [Trust API MCP Server]
         ↓
  Call score_transaction tool
         ↓
  Receive trust score + signals
         ↓
  Apply business logic
         ↓
  Make decision: APPROVE/REVIEW/DECLINE
         ↓
  Return decision + reasoning
```

## Features

- **Intelligent Decision Making**: Uses trust scores and risk signals to make informed decisions
- **Risk Level Classification**: Categorizes transactions into very_low, low, medium, high, very_high risk
- **Confidence Scoring**: Provides confidence level for each decision
- **Risk Factor Analysis**: Identifies specific risk signals (disposable email, VPN, TOR, etc.)
- **Actionable Recommendations**: Suggests next steps for each decision

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

## Usage

### Basic Usage

```python
from trust_agent import TrustAgent

async def check_user():
    agent = TrustAgent()

    try:
        await agent.connect()

        decision = await agent.make_decision(
            email="user@example.com",
            ip="8.8.8.8",
            action_type="signup"
        )

        agent.print_decision(decision)
    finally:
        await agent.disconnect()
```

### Run Examples

```bash
# Make sure TRUST_API_KEY is set in ../server/.env
python trust_agent.py
```

## Decision Logic

The agent uses the following rules:

| Score Range | Decision | Risk Level | Confidence | Action |
|------------|----------|------------|------------|---------|
| 800-1000 | APPROVE | very_low | 95% | Auto-approve |
| 600-799 | APPROVE | low | 85% | Approve with monitoring |
| 400-599 | REVIEW | medium | 70% | Manual review + additional verification |
| 200-399 | DECLINE | high | 80% | Likely decline unless verified |
| 0-199 | DECLINE | very_high | 95% | Auto-decline |

### Risk Factor Escalation

Even high scores can be escalated to REVIEW if critical risk factors are detected:
- Disposable email domains
- Proxy/VPN usage
- TOR network
- Bot/automated traffic

## Example Output

```
╔══════════════════════════════════════════════════════════╗
║           Trust API Agentic Flow Demo                   ║
║   Using MCP to make intelligent fraud decisions         ║
╚══════════════════════════════════════════════════════════╝

🔌 Connecting to Trust API MCP server...
✅ Connected to Trust API MCP server

📋 Available tools: 6
  - score_transaction: Score a transaction or user action for trust/fraud risk...
  - send_feedback: Send feedback about transaction outcomes...

============================================================
EXAMPLE 1: Legitimate User
============================================================

🔍 Analyzing transaction...
  Email: john.doe@gmail.com
  IP: 8.8.8.8
  Action: signup

📊 Trust Score: 750/1000
📋 API Decision: approve

============================================================
🤖 AGENT DECISION
============================================================

✅ Decision: APPROVE
📊 Confidence: 85%
⚠️  Risk Level: LOW

💭 Reasoning: Good trust score, acceptable risk level

💡 Recommendation: Monitor for unusual activity

============================================================
```

## Advanced Usage

### Custom Business Rules

You can extend the `TrustAgent` class to implement custom business rules:

```python
class CustomTrustAgent(TrustAgent):
    async def make_decision(self, email, ip, action_type="signup"):
        # Get base decision
        decision = await super().make_decision(email, ip, action_type)

        # Apply custom rules
        if email.endswith("@trusted-domain.com"):
            decision["decision"] = "APPROVE"
            decision["reason"] += " (trusted domain override)"

        return decision
```

### Batch Processing

```python
async def process_batch(users):
    agent = TrustAgent()
    await agent.connect()

    try:
        results = []
        for user in users:
            decision = await agent.make_decision(
                email=user["email"],
                ip=user["ip"]
            )
            results.append(decision)
        return results
    finally:
        await agent.disconnect()
```

## Architecture

- **TrustAgent**: Main agent class that orchestrates the decision-making flow
- **MCP Client**: Connects to the Trust API MCP server via stdio
- **Decision Logic**: Business rules for approve/review/decline
- **Signal Analysis**: Extracts and evaluates risk signals from API response

## Requirements

- Python 3.8+
- Node.js 18+ (for MCP server)
- Trust API key (set in `../server/.env`)

## License

MIT
