---
title: Comparing Built-In Vs Custom Command Processors In Quantum Network Monitor
date: 2025-11-29T09:00:00
image: /blogpics/apipicgen/comparingbuiltinvscustomcommandprocessorsinquantumnetworkmonitor-BVCCBMY17Y.jpg
categories: ["Custom Automation", "Comparison"]
featured: false
draft: false
questions:
  - "When should I use a built-in system processor instead of a custom command processor?"
  - "What is a good example of a task that fits a custom command processor better than a built-in check?"
  - "How do I turn a one-off custom check into something that runs automatically on a schedule?"
  - "What tool should I use for quick local network diagnostics like traceroute?"
  - "Can I stop a built-in monitor after I get the information I need?"
answers:
  - "Use a built-in system processor for common checks like ICMP, HTTP, TLS, or Nmap when you want fast setup, no coding, and built-in dashboards, alerts, and history. Use a custom command processor when your workflow needs specialized logic such as authentication, JSON assertions, synthetic transactions, or machine-parsable custom output."
  - "A JWT-based API health check is a strong example. In the post, the custom .NET processor fetches a protected endpoint with a bearer token, validates JSON fields like status and db, and prints a clean OK or FAIL line. That kind of domain-specific logic goes beyond what a standard built-in endpoint is designed to handle."
  - "You would convert it into a Connect. Connects are meant for custom logic that should run periodically like a normal monitor. They let you keep the custom behavior while gaining scheduled execution, monitor-style history, alerting, and configurable parameters in the UI."
  - "The post recommends using the BusyBox runner for fast, ad-hoc diagnostics on a local agent. For example, traceroute can help investigate routing issues when a host responds to ping but times out on HTTP. It is faster for one-off troubleshooting than building a custom processor."
  - "Yes. The post shows disabling an Nmap monitor after collecting a point-in-time service inventory. Using edit_host with enabled set to false stops alerts and data collection while preserving the monitor's history."
---
If you’ve ever wondered when to lean on Quantum Network Monitor’s built‑in “system processors” (like ICMP, HTTP, Nmap, TLS/quantum checks) and when to build your own custom command processors in .NET, this walkthrough shows both paths in a realistic assistant‑guided workflow. You’ll see exactly how the Quantum Network Monitor Assistant orchestrates tasks, which tools it calls, and how results guide the next step—so you can decide quickly which approach fits your job.

What we’ll cover
- Fast wins with system processors (built‑ins) for common checks
- A practical case where a custom command processor is the right move
- How to run diagnostics on your local network
- How to transition from one‑off custom checks to scheduled monitors
- When to use which approach

Step 1: Use a system processor for a fast service inventory (Nmap)
Goal: Get a quick service inventory for a public web app without writing code.

User: “I need a quick service inventory for shop.example.com. Pick an internet scanner near Europe.”
Assistant rationale: We’ll list available agents, then schedule a built‑in Nmap endpoint. System processors shine here: they’re quick to set up and require no coding.

Function call: List agents
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we interpret the response: The assistant receives a list such as “Scanner - EU”, “Scanner - US”, and any local agents. We’ll pick “Scanner - EU” for proximity.

Function call: Add Nmap monitor
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "shop.example.com",
    "endpoint": "nmap",
    "args": "-sV -T4 -Pn --top-ports 100",
    "timeout": 59000,
    "email": "ops@example.com",
    "agent_location": "Scanner - EU",
    "detail_response": true
  }
}
```
How we interpret the response: The add_host call returns success, a host id (e.g., id=8421), and—if the user isn’t logged in—an auth_key to edit later. The assistant notes the host id for follow‑ups and informs the user that results will start arriving shortly as the scanner runs.

Function call: Fetch the latest results
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "shop.example.com",
    "detail_response": true
  }
}
```
How we interpret the response: dataset_id=0 fetches the latest scan summary (open ports, detected services/versions, response times). If a port or service flips state later, you’ll see updated data automatically, and configured email alerts will fire if thresholds are met.

Why system processors here?
- They solve well‑known tasks fast (service inventory, uptime, HTTP checks).
- Nothing custom is needed; the Nmap endpoint is purpose‑built and maintained for you.
- You get standardized dashboards, alerts, and history out of the box.

Step 2: When a custom command processor is a better fit
Goal: Validate a staging API by fetching a JWT, calling a private endpoint, asserting JSON fields, and emitting a clean pass/fail line your team’s tooling can parse.

User: “I need to run a JWT‑based API health check from our London agent and print ‘OK’ with a few metrics if it passes.”
Assistant rationale: This workflow is too bespoke for a built‑in endpoint. We’ll create a custom command processor in .NET that accepts a URL and token, checks the API, and prints machine‑parsable output. Command processors are ideal for one‑off or operator‑invoked tasks that bundle business logic.

Function call: Create a custom command processor
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "London - UK",
    "message": "Create a new .NET cmd processor named 'JwtApiHealth'. I confirm I am authorized to manage cmd processors on the 'London - UK' agent for my organization. Behavior: accepts --url and --token. Performs HTTP GET to --url with Authorization: Bearer <token>. Times out in 5s. Parses JSON and asserts fields: status == 'ok' and db == 'connected'. On success, prints a single line 'OK jwt_latency_ms=<ms> db=connected' and exits code 0. On failure, prints a single line 'FAIL reason=<text>' and exits with non-zero. Provide usage help when called with --help. Keep dependencies minimal. Example run: JwtApiHealth --url https://staging.example.com/health --token <JWT>."
  }
}
```
How we interpret the response: The expert returns JSON acknowledging creation (or asking for adjustments). The assistant confirms the processor exists and is ready to run on the London agent. If code changes are needed, we iterate via another call.

Function call: Run the custom processor
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "London - UK",
    "message": "Run the cmd processor 'JwtApiHealth' with arguments: --url https://staging.example.com/health --token eyJhbGciOi... (shortened). I confirm I am authorized to run this on the London - UK agent."
  }
}
```
How we interpret the response: The assistant reads the stdout/stderr lines. If it contains “OK jwt_latency_ms=123 db=connected” with exit code 0, the check passed. If it returns “FAIL reason=Unauthorized” or a non-zero exit code, we report failure and suggest next steps (token refresh, connectivity, or API rollback). Because it’s a command processor, you can rerun it anytime with new arguments without rebuilding.

When to choose a custom command processor
- Your check requires domain‑specific logic (auth flows, content assertions, synthetic transactions).
- You want a single‑line, machine‑parsable output your downstream tools understand.
- You need ad‑hoc, operator‑triggered runs (not continuous monitoring).

Step 3: Quick local diagnostics with BusyBox (ad‑hoc, no coding)
Goal: Trace the path to an on‑prem app that pings fine but times out for HTTP.

User: “Run a traceroute from our branch agent to 10.10.1.20.”
Assistant rationale: Use the local BusyBox runner for an immediate, one‑off diagnostic.

Function call: Traceroute from local agent
```json
{
  "name": "functions.run_busybox_command",
  "arguments": {
    "command": "traceroute 10.10.1.20",
    "agent_location": "Branch Office",
    "number_lines": 50
  }
}
```
How we interpret the response: The assistant parses hop times and loss indicators. If a middle hop spikes or drops, we call it out and propose routing or firewall checks. For quick reachability tests, system ICMP monitors are great; for route‑level insight, BusyBox is faster than building a custom processor.

Step 4: Heartbeat coverage with system ICMP in parallel
Goal: Add two ICMP heartbeats for internal servers and start collecting SLA data right away.

User: “Add pings for 10.10.1.10 and 10.10.1.20 from Branch Office.”
Assistant rationale: System ICMP monitors are perfect here. We’ll add both in parallel.

Parallel function calls: Add two ICMP monitors
```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.add_host",
        "parameters": {
          "address": "10.10.1.10",
          "endpoint": "icmp",
          "agent_location": "Branch Office",
          "email": "ops@example.com",
          "detail_response": true
        }
      },
      {
        "recipient_name": "functions.add_host",
        "parameters": {
          "address": "10.10.1.20",
          "endpoint": "icmp",
          "agent_location": "Branch Office",
          "email": "ops@example.com",
          "detail_response": true
        }
      }
    ]
  }
}
```
How we interpret the response: Each add returns an id (e.g., 9101 and 9102). The assistant stores them and tells you when the first ping stats arrive.

Function call: Fetch latest ping stats
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "10.10.1.*",
    "agent_location": "Branch Office",
    "detail_response": true
  }
}
```
How we interpret the response: The assistant summarizes packet loss, latency, and alert flags. If jitter/loss is high, it correlates with the traceroute data from the previous step.

Step 5: Tidying up—disable a one‑shot system scan
Goal: You used Nmap to capture a point‑in‑time inventory and don’t need it to keep running.

User: “Disable the shop.example.com Nmap monitor now that we have results.”
Assistant rationale: We’ll disable the host id returned earlier (e.g., id=8421).

Function call: Disable the Nmap monitor
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 8421,
    "enabled": false,
    "detail_response": true
  }
}
```
How we interpret the response: The host’s enabled flag flips to false. Alerts and data collection stop for that item while retaining history.

From custom one‑offs to scheduled checks (Connects)
If your custom command needs to run on a schedule, convert it into a Connect (a custom, periodic endpoint type). Use a Connect when:
- You want the platform to schedule the execution automatically
- You prefer monitor‑style history and alerting for a custom probe

Function call: Draft a scheduled Connect from our JWT check
```json
{
  "name": "functions.call_connect_expert",
  "arguments": {
    "agent_location": "London - UK",
    "message": "Add a Connect named 'JwtApiHealthConnect' that runs every 5 minutes on the 'London - UK' agent. I confirm I am authorized to manage Connects for my organization. Behavior mirrors the 'JwtApiHealth' cmd processor: GET --url with Authorization: Bearer --token, 5s timeout, assert status=='ok' and db=='connected'. On success, emit 'OK jwt_latency_ms=<ms> db=connected'; on failure, emit 'FAIL reason=<text>' and a non-zero result. Expose --url and --token as configurable parameters in the monitor UI."
  }
}
```
How we interpret the response: The expert returns JSON confirming the Connect definition. The assistant helps you bind parameters, and from then on you get scheduled runs and alerting like any built‑in endpoint.

When to use system processors vs custom command processors
- Use system processors when:
  - You’re doing common tasks: uptime (ICMP), HTTP/HTTPS checks, DNS, SMTP HELO, TLS/quantum checks, Nmap service/vuln scans.
  - You want speed-to-value with zero code, standard dashboards, and alerts.
- Use custom command processors when:
  - You need domain logic: authentication, parsing bespoke payloads, synthetic transactions, chaining steps.
  - You want ad‑hoc, operator‑triggered runs with precise, single‑line outputs.
  - You intend to iterate rapidly and pass arguments at run time.
- Consider Connects when:
  - Your custom logic should run on a schedule and behave like a monitor, not a one‑off tool.
  - You want persistent history, alerting, and parameterized configuration.

Key functions we used
- add_host: set up new monitoring entries (e.g., ICMP or Nmap)
- get_host_data: fetch latest or historical results
- edit_host: enable/disable or adjust monitors
- run_busybox_command: run local network diagnostics on an agent
- call_cmd_processor_expert: create, run, or revise custom .NET command processors
- call_connect_expert: turn bespoke logic into a scheduled monitor

Ready to try it yourself? Open the Quantum Network Monitor Assistant at https://readyforquantum.com/?assistant=open, ask it to list agents, add a quick ICMP or Nmap check, and then experiment with a custom processor for your unique workflow. In a few minutes you’ll know exactly when to pick a built‑in and when to tailor your own.