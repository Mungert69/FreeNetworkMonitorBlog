---
title: Ensuring Server Availability Combining Monitoring And Diagnostics
date: 2025-01-19T23:58:00
image: /blogpics/apipicgen/ensuringserveravailabilitycombiningmonitoringanddiagnostics-WGLOC40BU6.jpg
categories: ["Server Monitoring", "Diagnostics"]
featured: false
draft: false
questions:
  - "How do I choose where monitoring runs, and why use both a cloud scanner and a local node?"
  - "Why is the HTTP check configured as \"http\" on port 443 if the API uses HTTPS?"
  - "What’s the quickest way to triage a spike of 502 errors?"
  - "Can I adjust monitor sensitivity during an incident without recreating checks?"
  - "How do I verify recovery and clear stale alerts, and what does dataset_id=0 mean?"
answers:
  - "Use get_agents to list available vantage points (e.g., “Scanner - EU”, “branch-office-switch”). Pick a cloud scanner for external, Internet-facing uptime checks and a local node to run on-path diagnostics like ping and traceroute. This combo distinguishes app/TLS issues from network path problems."
  - "The monitor performs a TLS handshake on 443 and then issues an HTTP request over that secure channel, validating status codes and response times at the application layer. This goes beyond “port open” and confirms the service is returning expected codes (e.g., 200/204/301) within your SLO."
  - "First, run an Nmap service/version scan via call_security_expert from the same EU vantage point, scoped to 80/443/8080/8443 with -Pn -sS -sV --reason --version-light and safe scripts (ssl-cert,http-title). If 443 is open and normal, run ping and traceroute from your local node (run_busybox_command) in parallel. Clean path implies an app/load balancer issue; loss or route changes point to a network problem."
  - "Yes. Use edit_host to change parameters like timeout (e.g., increase HTTP timeout during a rollback) and optionally duplicate the check from another region for comparison. When you added the host, the service returned IDs and an auth_key so you can update later—even if you weren’t logged in—while continuing to receive email alerts."
  - "dataset_id=0 fetches the latest logs via get_host_data so you can confirm ICMP/HTTP are healthy. Use get_host_data with alert_flag to list any active alerts, and once stable, call reset_alerts to clear flags. Monitoring continues normally and new regressions will trigger fresh alerts."
---
When uptime matters, you want both always-on monitoring and fast diagnostics when things go wrong. Here’s a walkthrough showing how a user and the Quantum Network Monitor Assistant work together to ensure a production API stays available—combining continuous monitoring logs, on-demand Nmap checks, and local network tools.

Scenario
The team wants to keep an eye on api.example.com from an EU vantage point, quickly pinpoint outages, and validate fixes. They’ll set up monitoring, watch the logs, run an Nmap service check during incidents, and use local diagnostics as needed.

Step 1: Pick where checks will run (agent selection)
User: We host in Frankfurt. I’d like to monitor from an EU scanner. I also have a branch router where I can run local pings and traceroute if needed.

Assistant: I’ll list available agents so you can choose a remote EU vantage point and your local node.

We call get_agents to see what’s available.

```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```

How we use the response: We show you a shortlist like “Scanner - EU, Scanner - US, branch-office-switch, gateway-node.” You pick “Scanner - EU” for external monitoring and “branch-office-switch” for local network diagnostics.

Step 2: Add monitors for availability and HTTP health
Assistant: We’ll set two monitors:
- ICMP (basic host reachability)
- HTTP on port 443 (service is HTTPS but we’ll do an HTTP request to the HTTPS port for an application-level check)

We use add_host to create these entries. If you aren’t logged in, we include your alert email so you get notifications.

```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "icmp",
    "timeout": 4000,
    "agent_location": "Scanner - EU",
    "email": "ops@example.com",
    "detail_response": true
  }
}
```

```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "http",
    "port": 443,
    "timeout": 5000,
    "agent_location": "Scanner - EU",
    "email": "ops@example.com",
    "detail_response": true
  }
}
```

How we use the response: The service returns host IDs and an auth_key (for unauthenticated edits). We store these so we can tweak settings later without re-adding. You’ll start getting uptime metrics, status codes, and response times. If a check fails, you’ll receive email alerts.

Step 3: Verify the baseline
User: Did the monitors activate? What do the latest logs show?

Assistant: Let’s fetch the latest data (dataset_id = 0) to validate that ICMP and HTTP are returning healthy.

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

How we use the response: We confirm:
- ICMP: reachable, stable latency (e.g., 12–20 ms).
- HTTP: status 200/204/301 as expected, response time within your SLO (e.g., <500 ms).
If we see non-200s or spikes, we’ll keep an eye on the trend and suggest thresholds.

Step 4: Proactive alert review
Assistant: We can also quickly list any current alerts.

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "alert_flag": true,
    "address": "api.example.com"
  }
}
```

How we use the response: If there’s an active alert, we’ll show the affected endpoint and start diagnostics. If not, we still have baselines for comparison.

Step 5: Incident! HTTP checks start failing
User: We got a spike of 502s on the HTTP check. Can you see what’s up?

Assistant: First, we’ll run an Nmap service check from the same EU vantage point to confirm service availability and fingerprint the service. This uses the Security Expert to coordinate an Nmap scan. We include scope confirmation and scan only the necessary ports.

```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "I am authorized to scan api.example.com. Please run an Nmap service/version scan from an EU vantage point to diagnose HTTP(S) availability issues. Target: api.example.com. Ports: 80,443,8080,8443. Options: -Pn -sS -sV --reason --version-light. Also include default scripts for TLS/HTTP where safe (e.g., --script=ssl-cert,http-title). Return open/filtered/closed states and banner/version info.",
    "agent_location": "Scanner - EU"
  }
}
```

How we use the response: We interpret open/closed/filtered states and any banners (e.g., “443/tcp open ssl/http nginx 1.24”). If 443 is open and serving expected TLS but 502s persist, the issue might be an upstream app or load balancer. If 443 is filtered or service signatures changed, it could be firewall or deployment drift.

Step 6: Validate from the local network (ping + traceroute)
Assistant: Let’s check from your branch router to see if packet loss or a routing change is at fault. We’ll run ping and traceroute in parallel to save time.

```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "ping -c 4 api.example.com",
          "agent_location": "branch-office-switch",
          "number_lines": 50
        }
      },
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "traceroute api.example.com",
          "agent_location": "branch-office-switch",
          "number_lines": 100
        }
      }
    ]
  }
}
```

How we use the response: 
- If ping loss is 0% and traceroute is stable, the path is healthy—likely an application or TLS/backend issue.
- If there’s high loss or a route change/timeout near the upstream ISP, we escalate to the network team and note the hop where it fails.

Step 7: Tighten or adapt the monitors during the incident
User: The app team is rolling back. Can we lengthen the HTTP timeout and keep a closer watch for the next hour?

Assistant: Yes—let’s extend the timeout and keep using the same EU vantage point. We’ll edit the existing HTTP monitor to reduce false positives while the rollback propagates.

```json
{
  "name": "functions.edit_host",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "http",
    "port": 443,
    "timeout": 9000,
    "agent_location": "Scanner - EU",
    "detail_response": true
  }
}
```

How we use the response: We confirm the update took effect (new timeout visible). If necessary, we can duplicate the check from a second region (e.g., “Scanner - US”) to compare regional impact.

Step 8: Confirm recovery and clear stale alerts
User: The rollback’s complete. Are we green?

Assistant: We’ll fetch the latest logs, then reset any stale flags once verified.

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

If the service is stable again, we clear the alert flags:

```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "address": "api.example.com",
    "endpoint": "http",
    "port": 443
  }
}
```

How we use the response: With clean status and alert flags reset, on-call visibility returns to normal. You’ll still get alerts if anything regresses.

Step 9: Review the last hour for root-cause context
Assistant: Let’s pull a historical slice to correlate event timing and response anomalies.

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "address": "api.example.com",
    "date_start": "2025-10-29T02:50:00",
    "date_end": "2025-10-29T03:50:00"
  }
}
```

How we use the response: We look for:
- Response time spikes preceding errors
- Changes in status codes
- ICMP stability contrasts as a hint toward app-level vs. network-level issues
We share the graph/trends with the app and network teams to close the incident.

Why these functions matter
- get_agents: Lists vantage points (cloud scanners and your local nodes).
- add_host: Establishes continuous checks (ICMP for reachability, HTTP for app-level health).
- get_host_data: Surfaces real-time and historical logs, alerts, and response metrics.
- call_security_expert (Nmap): Verifies exposed services and versions during incidents.
- run_busybox_command: Performs local pings/traceroutes to isolate network path issues.
- edit_host: Adapts monitoring thresholds and vantage points mid-incident.
- reset_alerts: Clears flags after recovery so you only see fresh incidents.

Wrap-up
With the Quantum Network Monitor Assistant, you get both proactive monitoring and reactive diagnostics in one workflow—so when availability dips, you can pinpoint whether it’s the app, TLS, or the network path. Try this multi-step approach on your own infrastructure and see how quickly you can move from alert to root cause. Explore the assistant and start monitoring at Quantum Network Monitor Assistant: https://readyforquantum.com/?assistant=open.