---
title: Using Openssl Via The Assistant For SSLTLS Security Checks
date: 2025-11-05T09:00:00
image: /blogpics/apipicgen/usingopensslviatheassistantforssltlssecuritychecks-QWB6SAGDNX.jpg
categories: ["SSL/TLS", "Security"]
featured: false
draft: false
questions:
  - "Why does the assistant use get_agents before running the OpenSSL checks?"
  - "What kinds of SSL/TLS issues can the Security Expert detect with OpenSSL?"
  - "How do I verify that TLS 1.0 and 1.1 are disabled but TLS 1.2 and 1.3 still work?"
  - "Can the same workflow be used for services running on non-standard HTTPS ports like 8443?"
  - "What is the benefit of adding ongoing HTTPS monitoring after the OpenSSL audit?"
answers:
  - "It uses get_agents to choose the best scanner location for the test. An internet-facing agent close to your users can give more realistic results for public services, while a local agent is useful for internal endpoints."
  - "It can check negotiated protocol and cipher, certificate chain validity, SAN coverage, hostname mismatches, expiration windows, ALPN support, OCSP stapling, and whether weak protocols or ciphers are still accepted."
  - "The assistant can ask call_security_expert to run OpenSSL s_client with protocol-specific flags like -tls1, -tls1_1, -tls1_2, and -tls1_3. The results show which handshakes fail or succeed and which cipher is negotiated for supported versions."
  - "Yes. The post shows the same OpenSSL checks being run against api.example.com:8443 by specifying the host, port, and server name, so you can assess certificates and TLS settings on non-default ports too."
  - "Ongoing monitoring helps catch regressions early, such as certificates nearing expiration, broken chains, hostname mismatches, or service outages. It turns a one-time audit into continuous visibility with alerts."
---
If you’ve ever wished you could run OpenSSL checks without dropping into a terminal, the Quantum Network Monitor Assistant makes it point-and-click simple—while still giving you the depth you need to assess SSL/TLS encryption health. In this walk-through, we’ll show a realistic, multi-turn conversation that uses the Security Expert via the assistant to run OpenSSL checks, read the results, and follow up with continuous monitoring to catch regressions early.

What we’re doing and why
- Goal: Use OpenSSL through the assistant to assess a site’s TLS configuration, certificate chain, protocol versions, cipher acceptance, and OCSP stapling.
- Core tool: call_security_expert (which runs OpenSSL and returns structured findings).
- Support tools: get_agents (pick where scans run from) and add_host/get_host_data (optional ongoing HTTPS monitoring for cert health).

Conversation, step by step

User: I want to check the SSL/TLS configuration for example.com with OpenSSL.

Assistant: Great—let’s first pick the best agent location to run the checks. I’ll list available agents so we can choose an internet-facing scanner close to your audience.

Function call used: get_agents lists available locations and capabilities.
Why it matters: Some checks are best run from a neutral internet vantage point (e.g., “Scanner - EU” or “Scanner - US”). If you have a local agent, that’s helpful for internal services too.

Function call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we use the response: We review the returned agent list and choose “Scanner - EU” for our internet-facing test. If you only have a local agent, the assistant will suggest installing one or just pick any available internet scanner.

Assistant: I’ll run a baseline OpenSSL handshake to capture the negotiated protocol/cipher, ALPN, certificate chain, SANs, and expiration. I’ll also ask for OCSP stapling details.

Function call used: call_security_expert telling it to use OpenSSL s_client and related checks.
Why it matters: This is the fastest way to confirm you’re getting TLS 1.2/1.3, strong ciphers, valid chains, proper SANs, and reasonable expiry windows.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Run an SSL/TLS configuration check on example.com using OpenSSL. Include: s_client -connect example.com:443 -servername example.com -showcerts -alpn h2,http/1.1; parse the peer certificate chain and SANs; report the negotiated protocol and cipher; capture OCSP stapling status; check certificate expiration window; and note any chain or name mismatches. I confirm I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response: The expert usually returns a summarized report of the OpenSSL output. Typical findings you’ll see include:
- Negotiated: TLSv1.3 with TLS_AES_256_GCM_SHA384 (strong and modern)
- ALPN: h2, http/1.1 (HTTP/2 enabled—good)
- Certificate chain: Valid, SAN includes example.com and www.example.com
- Expiration: 58 days remaining (set a reminder/monitor to renew ~30 days before expiry)
- OCSP stapling: Present and good (reduces latency and helps revocation checking)
- No hostname mismatch; chain builds to a trusted root

User: Can we confirm older protocols like TLS 1.0 and 1.1 are blocked, and that 1.2 and 1.3 are supported?

Assistant: Yes. I’ll explicitly test protocol negotiation attempts.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Using OpenSSL, attempt to connect to example.com:443 with specific protocol flags to confirm support/denial: test -tls1, -tls1_1, -tls1_2, and -tls1_3 using s_client with -servername example.com. Record which versions succeed or fail, and include the negotiated cipher for successes. I confirm I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response:
- TLS 1.0: handshake fails (good—legacy disabled)
- TLS 1.1: handshake fails (good—legacy disabled)
- TLS 1.2: handshake succeeds, ECDHE-ECDSA-AES256-GCM-SHA384 (strong)
- TLS 1.3: handshake succeeds, TLS_AES_256_GCM_SHA384 (strong)

User: Let’s audit cipher acceptance—ensure weak ciphers like RC4 or 3DES are blocked.

Assistant: I’ll tell the expert to probe cipher acceptance using OpenSSL’s cipher selection and targeted s_client attempts. We’ll also sample strong suites to confirm preferred ordering.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Using OpenSSL, test example.com:443 cipher acceptance. Attempt connections with selected weak ciphers (RC4, 3DES, NULL, MD5) and modern strong ciphers (TLS 1.2 ECDHE-ECDSA-AES256-GCM-SHA384, ECDHE-RSA-CHACHA20-POLY1305) and TLS 1.3 default sets. Summarize which ciphers are accepted and whether any legacy/weak ciphers succeed. I confirm I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response:
- Weak: RC4, 3DES, NULL, MD5 all refused (excellent)
- Strong: Modern ECDHE GCM and CHACHA20 accepted
- TLS 1.3: Only AEAD ciphers (as expected)

User: Can we verify OCSP stapling and chain depth in more detail, including intermediate validity?

Assistant: I’ll have the expert return stapling info, chain ordering, and validate intermediates. We’ll also ask for any missing intermediates or chain-building issues commonly seen with misconfigured servers.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "With OpenSSL s_client -status -servername example.com -connect example.com:443, capture OCSP stapling details, certificate chain ordering, and verify that intermediates are valid and properly served. Report missing intermediates or chain-building warnings. I confirm I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response:
- OCSP stapling: Good; response fresh within acceptable window
- Chain: Leaf → Intermediate → Root (presented correctly)
- No missing intermediate; AIA/chain building okay

User: I also have an API on api.example.com:8443. Can we run the same checks on that port?

Assistant: Yes. We’ll repeat the protocol and chain assessments for your API endpoint.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Run OpenSSL checks against api.example.com:8443 using s_client with -servername api.example.com. Capture negotiated protocol/cipher, certificate chain and SANs, expiration window, OCSP stapling, and any ALPN info if present. I confirm I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response:
- Negotiated: TLSv1.2 with ECDHE-RSA-CHACHA20-POLY1305
- SANs: api.example.com covered
- Expiration: 21 days left (short window—consider renewing soon)
- OCSP stapling: Not present (okay, but enabling can help performance and revocation visibility)

Assistant: Since the API cert is close to expiry, let’s set up a lightweight HTTPS monitor so you’ll get alerts ahead of time and can spot chain or hostname issues if they pop up.

Function call used: add_host creates an ongoing check. Note: If you’re not logged in, the assistant will ask for an email to send alerts. Here we provide one explicitly for the example.

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "https",
    "port": 8443,
    "email": "admin@example.com",
    "timeout": 15000
  }
}
```
How we use the response: You’ll receive a confirmation (and an auth key if you’re not logged in). The monitor will regularly verify the HTTPS endpoint and send alerts if the cert nears expiry, the chain breaks, or the host becomes unavailable.

Assistant: Want to peek at the latest monitoring data after a few minutes?

Function call used: get_host_data pulls the most recent results for the host.

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.example.com",
    "endpoint": "https",
    "port": 8443
  }
}
```
How we interpret the response: We review status OK/Fail, response time trends, and any warning flags (e.g., short expiry window or certificate mismatch), then plan next steps (renew, adjust configuration, or investigate outages).

Quick reference: what each function did here
- get_agents: Listed available agent locations and capabilities to choose where the OpenSSL checks run from.
- call_security_expert: Executed OpenSSL checks (s_client and related) and returned readable findings about protocols, ciphers, ALPN, certificate chain, SANs, expiry, and OCSP stapling.
- add_host: Set up ongoing HTTPS monitoring to alert on cert expiry, chain issues, and outages.
- get_host_data: Pulled the latest monitoring results so we could track encryption health over time.

Common issues you’ll spot fast with this workflow
- Legacy protocol support (TLS 1.0/1.1) still enabled.
- Acceptance of weak ciphers (RC4, 3DES, NULL).
- Missing or misordered intermediates causing trust-chain problems.
- Short certificate expiry windows or hostname mismatches.
- OCSP stapling disabled (not a blocker, but can be improved).

Wrap-up
You don’t need a terminal to get high-quality OpenSSL visibility. With the Quantum Network Monitor Assistant, you can:
- Run targeted OpenSSL checks via the Security Expert.
- Validate modern protocols and ciphers and catch legacy stragglers.
- Confirm certificate chains, SAN coverage, OCSP stapling, and expiration windows.
- Add simple ongoing HTTPS monitors to stay ahead of issues.

Ready to try it on your own domains or APIs? Open the Quantum Network Monitor Assistant at https://readyforquantum.com/?assistant=open, tell it your target, and follow the same steps shown above. It’ll guide you through agent selection, run the OpenSSL checks, and help you interpret the results and set up monitoring in minutes.