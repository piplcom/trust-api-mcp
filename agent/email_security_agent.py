#!/usr/bin/env python3
"""
Email Security Agent using Pydantic AI + MCP (PROPER WAY)
The agent autonomously discovers and uses MCP tools!
"""

import asyncio
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStdio

# Load environment variables
load_dotenv(dotenv_path=".env")

TRUST_API_MCP_PATH = "../server/dist/index.js"


class EmailSecurityDecision(BaseModel):
    """The agent's email security analysis decision."""

    decision: str = Field(description="The decision: SAFE, SUSPICIOUS, or BLOCK")
    risk_level: str = Field(
        description="Risk level: very_low, low, medium, high, very_high"
    )
    confidence: float = Field(
        description="Confidence score between 0 and 1", ge=0, le=1
    )
    reasoning: str = Field(description="Detailed reasoning for the decision")
    trust_score: int | None = Field(
        default=None, description="Trust API score (0-1000)"
    )
    risk_factors: list[str] = Field(
        default_factory=list, description="List of identified risk factors"
    )
    recommendations: list[str] = Field(
        default_factory=list, description="Recommended actions"
    )
    authentication_status: str | None = Field(
        default=None, description="Email authentication status (DKIM/SPF/DMARC)"
    )


class EmailAnalysisRequest(BaseModel):
    """Structured email security analysis request."""

    sender_email: str
    sender_name: str | None = None
    sender_ip: str
    recipient_email: str
    recipient_name: str | None = None
    recipient_ip: str | None = None
    arc_authentication_results: str | None = None
    dkim_signature: str | None = None
    message_id_domain: str | None = None


# Create MCP server connection - Agent will auto-discover tools!
# Pass stderr='pipe' to capture logs (default behavior shows them)
trust_api_server = MCPServerStdio(
    command="node",
    args=[TRUST_API_MCP_PATH],
    # stderr is passed through by default, so logs will appear in this terminal
)

# Create the email security agent with MCP toolset
email_security_agent = Agent(
    model="openai:gpt-4o",
    output_type=EmailSecurityDecision,
    system_prompt="""You are an expert email security analyst with access to Trust API tools via MCP.

Your job is to:
1. **Autonomously discover and use the available MCP tools** to analyze email security
2. Use `score_transaction` with action type "email_security" to analyze sender/recipient data
3. Analyze email authentication (DKIM, SPF, DMARC) and domain reputation
4. Check for email spoofing, phishing attempts, and domain mismatches
5. Make an intelligent decision: SAFE, SUSPICIOUS, or BLOCK
6. Provide clear reasoning for your decision
7. Identify specific security risks
8. Suggest appropriate actions

Decision Guidelines:
- Score 800-1000: SAFE (very_low risk) - Deliver to inbox
- Score 600-799: SAFE (low risk) - Deliver with monitoring
- Score 400-599: SUSPICIOUS (medium risk) - Flag for review or quarantine
- Score 200-399: BLOCK (high risk) - Likely phishing/spam
- Score 0-199: BLOCK (very_high risk) - Block immediately

Critical Email Security Risk Factors:
- Disposable or temporary email domains
- DKIM/SPF/DMARC authentication failures
- Sender domain mismatch with message_id domain
- VPN/Proxy/TOR usage from sender IP
- Brand new email accounts (0 days old)
- Known malicious IP addresses
- Domain reputation issues
- Suspicious sender/recipient patterns

Email Authentication Analysis:
- Check arc-authentication-results for DKIM, SPF, DMARC status
- Verify dkim-signature domain matches sender domain
- Cross-reference message_id_domain with sender domain
- Look for authentication bypass attempts

Always explain your security reasoning clearly and provide actionable recommendations.
""",
    toolsets=[trust_api_server],  # Agent auto-discovers all tools from MCP!
)


async def analyze_email_security(
    request: EmailAnalysisRequest,
) -> EmailSecurityDecision:
    """
    Analyze email security using the AI agent.

    The agent will autonomously:
    1. Discover available MCP tools
    2. Decide which tools to use
    3. Call them with appropriate parameters (action type: email_security)
    4. Analyze the results including authentication headers
    5. Make a structured security decision

    Args:
        request: EmailAnalysisRequest with sender, recipient, and metadata

    Returns:
        EmailSecurityDecision with the agent's security analysis
    """
    # Build detailed prompt with all email context
    prompt = f"""Analyze this email for security threats:

SENDER:
- Email: {request.sender_email}
- Name: {request.sender_name or 'N/A'}
- IP Address: {request.sender_ip}

RECIPIENT:
- Email: {request.recipient_email}
- Name: {request.recipient_name or 'N/A'}
- IP Address: {request.recipient_ip or 'N/A'}

EMAIL AUTHENTICATION METADATA:
- ARC Authentication Results: {request.arc_authentication_results or 'N/A'}
- DKIM Signature: {request.dkim_signature or 'N/A'}
- Message ID Domain: {request.message_id_domain or 'N/A'}

Use the available MCP tools with action type "email_security" to analyze sender and recipient trust data.
Check for email spoofing, phishing attempts, domain mismatches, and authentication issues.
Provide a comprehensive security assessment."""

    # The agent decides autonomously how to use the MCP tools!
    result = await email_security_agent.run(prompt)

    return result.output


def print_decision(decision: EmailSecurityDecision, request: EmailAnalysisRequest):
    """Pretty print the email security decision."""

    emoji = {"SAFE": "✅", "SUSPICIOUS": "⚠️", "BLOCK": "❌"}[decision.decision]

    risk_emoji = {
        "very_low": "🟢",
        "low": "🟡",
        "medium": "🟠",
        "high": "🔴",
        "very_high": "🔴🔴",
    }.get(decision.risk_level, "⚪")

    print("\n" + "=" * 70)
    print(f"{emoji} EMAIL SECURITY ANALYSIS (Autonomous Agent)")
    print("=" * 70)
    print(f"\n📧 Sender: {request.sender_email} ({request.sender_name or 'Unknown'})")
    print(f"🌐 Sender IP: {request.sender_ip}")
    print(
        f"\n📧 Recipient: {request.recipient_email} ({request.recipient_name or 'Unknown'})"
    )
    if request.recipient_ip:
        print(f"🌐 Recipient IP: {request.recipient_ip}")

    if decision.authentication_status:
        print(f"\n🔐 Authentication: {decision.authentication_status}")

    if decision.trust_score:
        print(f"\n📊 Trust Score: {decision.trust_score}/1000")

    print(f"\n{emoji} Decision: {decision.decision}")
    print(f"{risk_emoji} Risk Level: {decision.risk_level.upper()}")
    print(f"🎯 Confidence: {decision.confidence:.0%}")

    print(f"\n💭 Reasoning:")
    print(f"   {decision.reasoning}")

    if decision.risk_factors:
        print(f"\n🚨 Risk Factors ({len(decision.risk_factors)}):")
        for i, factor in enumerate(decision.risk_factors, 1):
            print(f"   {i}. {factor}")

    if decision.recommendations:
        print(f"\n💡 Recommendations:")
        for i, rec in enumerate(decision.recommendations, 1):
            print(f"   {i}. {rec}")

    print("\n" + "=" * 70)


async def main():
    """Run email security analysis examples."""

    print(
        """
╔══════════════════════════════════════════════════════════════════╗
║      Email Security Agent (Pydantic AI + MCP - PROPER)          ║
║          Agent autonomously discovers and uses MCP tools         ║
╚══════════════════════════════════════════════════════════════════╝
"""
    )

    # The agent manages the MCP connection lifecycle
    async with email_security_agent:
        print("\n🔍 Agent is discovering available MCP tools...")
        print("✅ Agent ready! It will autonomously decide which tools to use.\n")

        # Example 1: Legitimate email with full authentication
        print("=" * 70)
        print("EXAMPLE 1: Analyzing Legitimate Email (Gmail to Corporate)")
        print("=" * 70)

        request1 = EmailAnalysisRequest(
            sender_email="yuri1992@gmail.com",
            sender_name="Yuri Ritvin",
            sender_ip="8.8.8.8",
            recipient_email="moshee@pipl.com",
            recipient_name="Moshe Elkayam",
            recipient_ip="1.1.1.1",
            arc_authentication_results="mx.google.com; dkim=pass header.i=@gmail.com; spf=pass; dmarc=pass",
            dkim_signature="v=1; a=rsa-sha256; d=gmail.com; s=google;",
            message_id_domain="gmail.com",
        )
        decision1 = await analyze_email_security(request1)
        print_decision(decision1, request1)

        # Example 2: Suspicious email - disposable domain
        print("\n\n" + "=" * 70)
        print("EXAMPLE 2: Analyzing Suspicious Email (Disposable Domain)")
        print("=" * 70)

        request2 = EmailAnalysisRequest(
            sender_email="temp12345@tempmail.com",
            sender_name="John Doe",
            sender_ip="192.168.1.1",
            recipient_email="support@pipl.com",
            recipient_name="Support Team",
            arc_authentication_results="mx.tempmail.com; dkim=fail; spf=fail; dmarc=fail",
            dkim_signature="v=1; a=rsa-sha256; d=tempmail.com; s=default;",
            message_id_domain="tempmail.com",
        )
        decision2 = await analyze_email_security(request2)
        print_decision(decision2, request2)

        # Example 3: Phishing attempt - domain mismatch
        print("\n\n" + "=" * 70)
        print("EXAMPLE 3: Analyzing Phishing Attempt (Domain Mismatch)")
        print("=" * 70)

        request3 = EmailAnalysisRequest(
            sender_email="admin@secure-banking.net",
            sender_name="Security Department",
            sender_ip="45.123.45.67",  # Suspicious IP range
            recipient_email="user@example.com",
            recipient_name="Account Holder",
            arc_authentication_results="mx.suspicious.com; dkim=fail; spf=fail; dmarc=fail",
            dkim_signature="v=1; a=rsa-sha256; d=secure-banking.net; s=default;",
            message_id_domain="mail-relay.xyz",  # Domain mismatch!
        )
        decision3 = await analyze_email_security(request3)
        print_decision(decision3, request3)


if __name__ == "__main__":
    # Check for API keys
    if not os.getenv("OPENAI_API_KEY"):
        print("\n❌ ERROR: OPENAI_API_KEY not found!")
        print("Please set OPENAI_API_KEY in agent/.env")
        exit(1)

    asyncio.run(main())
