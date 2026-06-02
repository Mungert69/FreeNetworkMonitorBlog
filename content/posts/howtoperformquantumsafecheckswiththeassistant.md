---
title: How To Perform Quantum-Safe Checks With The Assistant
date: 2025-11-25T09:00:00
image: /blogpics/apipicgen/howtoperformquantumsafecheckswiththeassistant-TFW5466KTX.jpg
categories: ["Quantum Security", "Compliance"]
featured: false
draft: false
questions:
  - "What is the difference between the \"quantum\" and \"quantumcert\" monitor types?"
  - "Why does the walkthrough use a public scanner agent like \"Scanner - EU\" instead of a local agent?"
  - "Why is SNI included in the monitor arguments?"
  - "If a site still uses classical certificates, does that mean it has failed the quantum readiness check?"
  - "When should alerts be reset after making changes?"
answers:
  - "The \"quantum\" monitor checks the TLS handshake to see whether an endpoint supports post-quantum or hybrid key exchange mechanisms, such as hybrid KEMs. The \"quantumcert\" monitor examines the certificate chain to determine whether the certificates use classical, hybrid, or post-quantum signature approaches."
  - "A public scanner agent shows what external users on the internet would see when connecting to the site. This is useful for validating public-facing infrastructure. A local agent would be more appropriate for testing internal services or systems behind a firewall."
  - "SNI ensures the TLS handshake is tested against the correct hostname, which is especially important for multi-tenant servers or CDNs that host multiple domains on the same IP address. Without SNI, the monitor might receive the wrong certificate or handshake behavior."
  - "Not necessarily. The post explains that many sites today still present classical certificates, so this often results in an advisory rather than a hard alert. A site may still be partially prepared if it supports hybrid KEMs in the TLS handshake, while certificate modernization is handled as a phased transition."
  - "Alerts should be reset after you confirm that remediation worked, such as verifying that hybrid KEM negotiation now succeeds and there are no active alert flags. Resetting alerts at that point helps keep the dashboard clean so future issues are easier to spot."
---
Many teams want to answer a simple question: “Is my public-facing infrastructure on track for a post-quantum world?” In this walkthrough, we’ll show a realistic, multi-turn conversation where a user leverages the Quantum Network Monitor Assistant to add quantum-focused monitors, validate cryptographic readiness, and iterate with agent-powered checks. You’ll see the exact JSON function calls the assistant would make and how the results inform next steps.

Scenario overview
- Goal: Validate quantum-safe readiness for a couple of public endpoints.
- Focus: Using the quantum and quantumcert endpoint types plus an expert quantum assessment.
- Agent strategy: Run checks from an internet-based scanner agent so we’re testing what the world sees.

Step 1 — User sets the goal and target
User: I want to check if example.com and api.example.com are quantum-safe or at least hybrid-ready.

Assistant: Great. We’ll do two categories of checks:
- quantum: test whether the TLS handshake supports post-quantum/hybrid KEMs.
- quantumcert: test whether the certificate chain is quantum-resistant or hybrid.
We’ll run from a public scanner agent so we see the same results an external client would.

First, let me list available agents.

Function call (get_agents)
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we use the response
- The assistant presents “Scanner - US”, “Scanner - EU”, and any user-specific local agents (if installed).
- The user chooses “Scanner - EU” to test from Europe’s vantage point. If a local agent is needed for inside-the-firewall tests, the assistant would point to the installer: https://freenetworkmonitor.click/download

Step 2 — Add the quantum TLS handshake monitors (quantum endpoint)
Assistant: Since you’re not logged in, please provide an email for alerting and ownership of these monitors.

User: security-team@example.org

Assistant: I’ll add two quantum endpoint monitors, one for example.com:443 and one for api.example.com:443. I’ll also set SNI to ensure the handshake is validated against the intended hostname, and allow the monitor to probe all supported KEMs by default.

Function calls (add_host for both endpoints)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "example.com",
    "endpoint": "quantum",
    "port": 443,
    "args": "sni=example.com",
    "email": "security-team@example.org",
    "agent_location": "Scanner - EU",
    "timeout": 30000
  }
}
```
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "quantum",
    "port": 443,
    "args": "sni=api.example.com",
    "email": "security-team@example.org",
    "agent_location": "Scanner - EU",
    "timeout": 30000
  }
}
```
How we use the response
- Each call returns a host ID and confirms scheduling; for example, host_id=1241 (example.com) and host_id=1242 (api.example.com).
- The assistant informs the user that quantum KEM support checks will run on the next cycle and alerts will go to security-team@example.org.

Step 3 — Add the quantum certificate monitors (quantumcert endpoint)
Assistant: Next, let’s validate the certificate chains for post-quantum or hybrid signatures.

Function calls (add_host for quantumcert)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "example.com",
    "endpoint": "quantumcert",
    "port": 443,
    "args": "sni=example.com",
    "email": "security-team@example.org",
    "agent_location": "Scanner - EU",
    "timeout": 30000
  }
}
```
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "quantumcert",
    "port": 443,
    "args": "sni=api.example.com",
    "email": "security-team@example.org",
    "agent_location": "Scanner - EU",
    "timeout": 30000
  }
}
```
How we use the response
- We now have four monitors scheduled: two for handshake/KEM support, two for certificate chain properties. Each returns a host ID and a confirmation that monitoring is active.

Step 4 — Pull the latest monitoring results
Assistant: Let’s fetch the latest data to see what the outside world sees right now.

Function calls (get_host_data for the latest results)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "example.com",
    "endpoint": "quantum",
    "detail_response": true
  }
}
```
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "example.com",
    "endpoint": "quantumcert",
    "detail_response": true
  }
}
```
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "api.example.com",
    "endpoint": "quantum",
    "detail_response": true
  }
}
```
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "api.example.com",
    "endpoint": "quantumcert",
    "detail_response": true
  }
}
```
How we use the response
- For quantum: We look for fields indicating which TLS KEMs were negotiated or supported. If the response shows “supports_hybrid_kem: true” with something like “x25519+kyber768,” that’s a good sign of hybrid readiness.
- For quantumcert: We check certificate signature algorithms (e.g., ecdsa/secp256r1), whether any post-quantum or hybrid certs are presented, and validation status. Most sites today will still show classical signatures—so no PQC yet—triggering an advisory rather than a hard alert.

Step 5 — Ask the Quantum Expert for a deeper readiness review
Assistant: For a comprehensive analysis, I can ask the Quantum Expert to evaluate TLS KEM readiness and certificate strategy and provide clear remediation guidance.

Function call (call_quantum_expert)
```json
{
  "name": "functions.call_quantum_expert",
  "arguments": {
    "message": "Assess example.com and api.example.com for TLS KEM support and post-quantum certificate usage. Provide a readiness summary, recommended hybrid KEMs, and certificate transition guidance. Confirm that I am authorized to run this assessment.",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the response
- The expert returns a narrative with specifics such as: “example.com: supports X25519 only (no KEM hybrid). api.example.com: supports X25519+Kyber768 hybrid via TLS 1.3 draft KEM extension. Certificates: both endpoints present classical ECDSA; consider hybrid or PQC-ready issuance plan.”
- The assistant turns that into step-by-step guidance with vendor-agnostic recommendations: enable KEM hybrid on your edge/TLS terminator, prepare a dual-track PKI plan, and test staged rollouts with a canary domain before broad adoption.

Step 6 — Fine-tune monitors (optional)
User: Can you restrict the example.com quantum test to probe Kyber768 only and increase the timeout?

Assistant: Sure. I’ll update the existing monitor (using the host’s address; IDs can also be used).

Function call (edit_host)
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "address": "example.com",
    "endpoint": "quantum",
    "args": "sni=example.com;probe_kems=kyber768",
    "timeout": 45000,
    "agent_location": "Scanner - EU",
    "enabled": true
  }
}
```
How we use the response
- The monitor confirms it’s updated and the next runs will use the tighter probe set and longer timeout, which is helpful when testing across regions or under transient load.

Step 7 — Review and clear alerts after remediation
User: We enabled hybrid KEM on example.com. Can you confirm it’s green and then clear previous alerts?

Assistant: I’ll re-check the latest run and then reset monitor alerts so your dashboard is clean.

Function calls (get_host_data, then reset_alerts)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "example.com",
    "endpoint": "quantum",
    "detail_response": true
  }
}
```
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "address": "example.com",
    "endpoint": "quantum"
  }
}
```
How we use the response
- If the latest data shows hybrid KEM negotiation succeeded and no active alert_flag, we confirm the fix. Then, resetting alerts cleans historical flags so new issues stand out.

Putting it all together: What each function does and why it matters
- get_agents: Lists available monitoring agents. We chose a public “Scanner - EU” agent to validate what external clients see.
- add_host: Creates monitors for quantum (TLS KEM support) and quantumcert (certificate chain post-quantum posture).
- get_host_data: Retrieves latest or historical results to validate changes and monitor ongoing posture.
- edit_host: Adjusts probe parameters, SNI, timeouts, or agent location without recreating monitors.
- reset_alerts: Clears alert flags after remediation to keep dashboards actionable.
- call_quantum_expert: Produces a practical, prioritized readiness plan beyond raw protocol data.

Pro tips for quantum-safe monitoring
- Always set SNI when checking multi-tenant TLS endpoints.
- Test from multiple agents if your CDN or geo-routing changes handshake behavior by region.
- Iterate: start with broad KEM probing, then narrow to target hybrids you plan to deploy (e.g., X25519+Kyber768).
- Plan for certificates: most orgs will move from classical to hybrid or PQC-ready issuance in phases. Keep quantumcert monitors in place during every rollout step.

That’s it—the assistant guided us from agent selection to live quantum checks, expert interpretation, and clean remediation workflows. Ready to try it with your own domains? Open the Quantum Network Monitor Assistant here: https://readyforquantum.com/?assistant=open and start validating your quantum-safe readiness today.