---
title: Host Down Diagnosing Outages In Real-Time With The Assistant
date: 2025-11-23T09:00:00
image: /blogpics/apipicgen/hostdowndiagnosingoutagesinrealtimewiththeassistant-YDI8KHYXMT.jpg
categories: ["Incident Response", "Diagnostics"]
featured: false
draft: false
questions:
  - "How does the assistant determine what kind of failure caused api.example.com to go down?"
  - "Why does the workflow run diagnostics from more than one agent location?"
  - "What checks can the assistant perform beyond simple uptime monitoring?"
  - "How can the assistant help prevent similar outages from being missed in the future?"
  - "What happens after the issue is fixed?"
answers:
  - "It starts by pulling the latest host check data with get_host_data and reviewing details like availability status, endpoint type (such as HTTP, HTTPS, or ICMP), the agent location that observed the issue, and any error messages like timeouts, DNS failures, or TLS errors. That helps narrow the problem to network reachability, DNS, TLS, or the application/service itself."
  - "Using multiple agents helps compare results from different vantage points. If one region fails while another succeeds, the issue may be regional or related to an upstream provider. If both fail in similar ways, the problem is more likely provider-side, host-side, or global rather than isolated to one path."
  - "The assistant can run ping and traceroute for network diagnostics, query DNS records with dig, perform SSL/TLS analysis through the security expert, and schedule Nmap-based service checks. Together, these help identify whether the root cause is connectivity, name resolution, certificate issues, protocol mismatches, or port/service problems."
  - "It can add targeted monitors, such as an HTTPS monitor on port 443 to detect certificate and TLS issues earlier, or an Nmap service check to catch filtered or closed ports and service drift. These extra monitors provide more specific alerts before a full outage occurs."
  - "The assistant rechecks the affected endpoint, such as HTTPS, using fresh host data to confirm the service is healthy again. Once the recovery is verified, it can reset the active alerts so the dashboard clears and the incident is marked resolved."
---
When a production host goes down, minutes matter. Here’s a realistic, step-by-step conversation showing how the Quantum Network Monitor Assistant can automatically pivot from an alert to root-cause diagnostics using built-in monitoring, security scans, and network tools—so you can restore service fast. You can follow along or try it yourself via the Quantum Network Monitor Assistant.

User: I just got an alert that api.example.com is down. What happened?

Assistant: I’ll confirm the alert, pull the most recent check, and identify which agent saw the failure.

We use get_host_data to fetch the latest result for this host and see which checks failed.

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.example.com"
  }
}
```

How we interpret the response: We look for status/availability, the agent_location that ran the check (e.g., “Scanner - US-East”), the endpoint (icmp/http/https), and any error details (timeout, DNS failure, TLS error). If the result shows, for example, “http 443 connect timeout” from “Scanner - US-East,” we know the failure is likely network path or service level—not just application logic.

User: Can you test from a second vantage point too?

Assistant: Yes—first, I’ll list available agents so you can choose where to run diagnostics.

We use get_agents to see cloud and local agents.

```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```

How we interpret the response: We surface options like “Scanner - US-East,” “Scanner - EU,” and any of your local agents (e.g., “ACME-NOC-Laptop - user@company.com”). This helps you decide where to run tests in parallel for path triangulation.

User: Run quick network diagnostics (ping + traceroute) from US-East and from my laptop agent.

Assistant: Great. Running a parallel ping and traceroute lets us see if loss is local to one region or global.

We’ll use run_busybox_command from two agents in parallel.

```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "ping -c 4 api.example.com",
          "agent_location": "Scanner - US-East",
          "number_lines": 40
        }
      },
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "traceroute api.example.com",
          "agent_location": "Scanner - US-East",
          "number_lines": 60
        }
      },
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "ping -c 4 api.example.com",
          "agent_location": "ACME-NOC-Laptop",
          "number_lines": 40
        }
      },
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "traceroute api.example.com",
          "agent_location": "ACME-NOC-Laptop",
          "number_lines": 60
        }
      }
    ]
  }
}
```

How we interpret the response: If US-East ping times out and traceroute stalls at your edge provider, but your laptop’s traceroute reaches the host, that suggests a region-specific upstream issue. If both fail at the same hop, it’s likely provider-side or host-side. If both succeed, the earlier failure might be HTTP/TLS-specific rather than pure reachability.

User: Maybe it’s DNS. Can you check name resolution from both locations?

Assistant: Absolutely. We’ll query DNS from both agents to rule out a bad or stale record.

```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "dig +short A api.example.com && dig +short AAAA api.example.com",
          "agent_location": "Scanner - US-East",
          "number_lines": 40
        }
      },
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "dig +short A api.example.com && dig +short AAAA api.example.com",
          "agent_location": "ACME-NOC-Laptop",
          "number_lines": 40
        }
      }
    ]
  }
}
```

How we interpret the response: If both locations resolve to the same IPs (e.g., 203.0.113.42) and v6 looks fine or absent by design, DNS likely isn’t the issue. If one location resolves differently or fails, we’ll suspect split-horizon DNS or resolver problems.

User: The site uses HTTPS—can you check if TLS is the culprit?

Assistant: Yes. I’ll run an SSL/TLS configuration check to see certificate status, SNI, protocol/cipher issues, and common misconfigurations.

We use call_security_expert to drive an OpenSSL/Nmap-style TLS analysis.

```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "I am authorized to run an SSL/TLS configuration check on api.example.com. Please perform an OpenSSL-based handshake and certificate review, confirm SNI handling for api.example.com on port 443, report protocol/cipher support, and highlight any certificate expiry or hostname mismatch issues.",
    "agent_location": "Scanner - US-East"
  }
}
```

How we interpret the response: If the expert reports “certificate expired yesterday” or “hostname mismatch (CN=www.example.com)”, then HTTPS failures would match our monitor’s errors. If the cert is valid but the handshake shows protocol mismatches (e.g., server disabled TLS 1.2 while clients require it), we flag that. If TLS is clean, we return to connectivity/layer-4 analysis.

User: If it’s an expired certificate, add a dedicated HTTPS monitor so we catch that earlier next time.

Assistant: Done. We’ll add a targeted HTTPS monitor that alerts before expiry and tracks TLS health.

We use add_host to create the HTTPS check. If you’re not logged in, the assistant will prompt for an email to send alerts.

```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "api.example.com",
    "endpoint": "https",
    "port": 443,
    "timeout": 59000,
    "agent_location": "Scanner - US-East"
  }
}
```

How we interpret the response: We store the new host’s ID/auth_key (if returned) so we can update or delete it later, and confirm it’s enabled. Subsequent checks will generate early warnings (e.g., “certificate expires in 14 days”).

User: Can we also add a periodic Nmap service check for the API port to spot firewall or service drift?

Assistant: Yes. A lightweight service scan can catch closed/filtered states and banner changes.

```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "api.example.com",
    "endpoint": "nmap",
    "args": "-Pn -p 443",
    "agent_location": "Scanner - US-East"
  }
}
```

How we interpret the response: The system will run scheduled Nmap checks and alert on service availability changes, giving you a clear signal if the port becomes filtered or the service is offline.

User: I’ve renewed the certificate. Can you recheck and then clear the alert?

Assistant: I’ll confirm the fix with a fresh HTTPS read and then reset the alert.

First, retrieve the latest host data again:

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.example.com",
    "endpoint": "https"
  }
}
```

How we interpret the response: If the status is now healthy (e.g., handshake OK, valid chain, expected protocols), the outage condition is resolved.

Next, reset active alerts so your dashboard returns to green:

```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "alert_type": "monitor",
    "address": "api.example.com",
    "endpoint": "https"
  }
}
```

How we interpret the response: The alert flag is cleared for that host/endpoint. If you’re not logged in and added the host earlier from a guest session, we’d include the auth_key that was issued on creation.

User: If this happens again at 3 a.m., can the assistant automate these checks?

Assistant: That’s exactly the point. Here’s the automated flow we’ve effectively built:
- Alert fires on api.example.com (HTTP/HTTPS/ICMP/Nmap).
- Assistant immediately pulls latest host data and identifies the failing layer.
- Parallel reachability tests (ping/traceroute) run from multiple agents.
- DNS is verified from multiple vantage points.
- If HTTPS is implicated, the Security Expert runs an SSL/TLS assessment.
- Findings are summarized, with a single, actionable root cause.
- Optional: The assistant updates or adds monitors (e.g., HTTPS/Nmap) for earlier warnings next time.
- After remediation, the assistant verifies status and resets alerts.

You can replicate this workflow on your own infrastructure in minutes. From your first alert to verified root cause—without context switching between tools—the Quantum Network Monitor Assistant centralizes the entire troubleshooting path. Try it now via the Quantum Network Monitor Assistant and be ready for the next “Host Down?” moment.