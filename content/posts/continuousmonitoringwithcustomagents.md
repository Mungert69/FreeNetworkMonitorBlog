---
title: Continuous Monitoring With Custom Agents
date: 2025-10-30T09:00:00
image: /blogpics/apipicgen/continuousmonitoringwithcustomagents-CUT0LBKT2U.jpg
categories: ["Agents", "Monitoring"]
featured: false
draft: false
questions:
  - "Why would I use both a local agent and a cloud agent to monitor the same API?"
  - "What is the benefit of adding both HTTPS and ICMP monitors for the same host?"
  - "How can I confirm that my monitors were created with the correct agents and settings?"
  - "Why would I increase the timeout for one region, like the US East monitor?"
  - "What does resetting alerts do after changing monitor settings?"
answers:
  - "Using both gives you multiple vantage points, so you can compare latency, uptime, and reliability from different networks or regions. A local agent shows how the service performs from your office or internal environment, while a cloud agent shows how it behaves for external users in another geography."
  - "HTTPS monitors check application availability and SSL/TLS health, while ICMP monitors test raw network reachability and basic latency. Comparing the two helps you tell whether delays or failures are caused by the network path itself or by higher-layer HTTPS and TLS processing."
  - "You can use the host list function filtered by the target address to review each monitor. This lets you verify details such as agent location, protocol, port, and timeout so you can catch and correct any configuration mistakes right away."
  - "If a region has naturally higher latency or occasional network variability, a longer timeout can reduce false-positive alerts. In the example, the US East HTTPS timeout was increased from 7000 ms to 10000 ms to better match expected round-trip times while routing was being evaluated."
  - "Resetting alerts clears existing alert states so only new incidents are reported going forward. This is useful after tuning thresholds or timeouts because it gives you a clean baseline for validating whether the updated configuration works as intended."
---
In this guided conversation, we show how a network engineer uses the Quantum Network Monitor Assistant to deploy local and cloud agents for targeted monitoring and compare performance. The goal: set up continuous monitoring from multiple vantage points, validate reachability, and analyze latency and reliability side by side.

User: I want to monitor our public API from both our office network and the cloud. Can you help me set up two monitors so I can compare latency and uptime?

Assistant: Absolutely. First, let’s see what monitoring agents are available in your account—local agents (on your own hardware) and cloud scanners (like “Scanner - US East” or “Scanner - EU”). I’ll list agents you can run jobs on.

Function call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we use the response
- We receive a compact list of agent locations (e.g., “Office - London (you@company.com)”, “Scanner - US East”, “Scanner - EU”). If no local agent appears, we’ll suggest installing one from https://freenetworkmonitor.click/download so you can monitor internal or geofenced services.

User: Great—I see “Office - London” as my local agent and “Scanner - US East” in the cloud. Let’s monitor https://api.acme.com from both.

Assistant: Perfect. We’ll add two monitors targeting the same HTTPS service so results are comparable. The HTTPS endpoint checks availability and SSL/TLS health. If you’re not logged in, I’ll include your email for alerts. I’ll set a modest timeout to start and we can tune it later.

Function call (add monitor from local agent)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "https",
    "port": 443,
    "timeout": 7000,
    "email": "netops@acme.com",
    "agent_location": "Office - London"
  }
}
```

Function call (add monitor from cloud agent)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "https",
    "port": 443,
    "timeout": 7000,
    "email": "netops@acme.com",
    "agent_location": "Scanner - US East"
  }
}
```
How we use the response
- We get two host IDs (e.g., 101 and 102) and, if you’re not logged in, an auth_key to edit them later. Both entries begin continuous checks from their respective agents, and you’ll receive email alerts if either location detects downtime or SSL issues.

User: Can we confirm both monitors are active and using the right agents?

Assistant: Yes—let’s list your monitors filtered by the address.

Function call
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "address": "api.acme.com"
  }
}
```
How we use the response
- We verify two entries exist:
  - ID 101: api.acme.com via Office - London (https, 443, timeout 7000 ms)
  - ID 102: api.acme.com via Scanner - US East (https, 443, timeout 7000 ms)
- If anything looks off (wrong agent or port), we would immediately correct it.

User: Let’s see how performance compares right now.

Assistant: I’ll pull the latest results from each agent. Running both lookups in parallel speeds things up.

Parallel function calls
```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.get_host_data",
        "parameters": {
          "dataset_id": 0,
          "address": "api.acme.com",
          "agent_location": "Office - London",
          "detail_response": true
        }
      },
      {
        "recipient_name": "functions.get_host_data",
        "parameters": {
          "dataset_id": 0,
          "address": "api.acme.com",
          "agent_location": "Scanner - US East",
          "detail_response": true
        }
      }
    ]
  }
}
```
How we use the response
- We compare key metrics:
  - Status: up from both agents
  - Latency: e.g., 32 ms (Office - London) vs 86 ms (US East)
  - SSL/TLS details: certificate valid, expiration in 64 days
- Immediate insight: the service is healthy, and transatlantic RTT explains higher US latency.

User: I’d like to see a 24-hour comparison as a baseline.

Assistant: We’ll pull a time-bounded window from each agent to compare availability, latency spread, and error rates.

Function call (local agent historical)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "address": "api.acme.com",
    "agent_location": "Office - London",
    "date_start": "2026-03-16T00:00:00",
    "date_end": "2026-03-17T00:00:00",
    "detail_response": true
  }
}
```

Function call (cloud agent historical)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "address": "api.acme.com",
    "agent_location": "Scanner - US East",
    "date_start": "2026-03-16T00:00:00",
    "date_end": "2026-03-17T00:00:00",
    "detail_response": true
  }
}
```
How we use the response
- We chart:
  - Uptime: e.g., 100% (London) and 99.7% (US East) due to a brief provider hiccup
  - Latency distribution: tighter in London, bimodal in US due to network congestion windows
  - Any SSL errors or alerts (none observed)
- Actionable takeaway: slight performance volatility from the US; consider CDN POP placement or regional routing tweaks.

User: Let’s also measure raw reachability to separate network path issues from HTTPS overhead.

Assistant: Good idea. ICMP checks isolate network latency and packet loss without TLS or app-layer variability. I’ll add ICMP monitors from both agents.

Function call (ICMP from local)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "icmp",
    "timeout": 4000,
    "email": "netops@acme.com",
    "agent_location": "Office - London"
  }
}
```

Function call (ICMP from cloud)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "icmp",
    "timeout": 4000,
    "email": "netops@acme.com",
    "agent_location": "Scanner - US East"
  }
}
```
How we use the response
- We now have four total monitors: 2x HTTPS, 2x ICMP. Comparing ICMP vs HTTPS by region reveals whether added HTTPS processing or TLS handshakes are a major contributor to observed latency.

User: I noticed a few timeouts on the US HTTPS checks. Can we relax the timeout there?

Assistant: Yes—let’s bump the US East HTTPS timeout from 7000 ms to 10000 ms to reduce false positives while we evaluate routing.

Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 102,
    "timeout": 10000
  }
}
```
How we use the response
- We confirm the timeout is updated on the US East HTTPS monitor (ID 102). Subsequent checks use the new threshold, and alert sensitivity is tuned to the region’s typical RTT.

User: We tuned the thresholds. Reset any existing alerts so we only see new ones going forward.

Assistant: Resetting current alerts for those monitors.

Function call
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "id": 101
  }
}
```

Function call
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "id": 102
  }
}
```
How we use the response
- Alert flags clear for both entries. You’ll only be notified of fresh incidents after the reset, simplifying post-tuning validation.

User: Can we quickly view all monitors tied to this service and sanity-check configuration?

Assistant: Sure—filter by address to review everything we’ve built.

Function call
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "address": "api.acme.com"
  }
}
```
How we use the response
- We see:
  - ID 101: https, Office - London, timeout 7000
  - ID 102: https, Scanner - US East, timeout 10000
  - ID 201: icmp, Office - London, timeout 4000
  - ID 202: icmp, Scanner - US East, timeout 4000
- Everything looks aligned for side-by-side comparison across agents and protocols.

Closing thoughts
- We used get_agents to discover available vantage points (local and cloud).
- We used add_host to create monitoring entries from multiple agents for the same target, making it easy to compare performance across geographies.
- We used get_host_list and get_host_data to confirm configuration, pull latest metrics, and analyze 24-hour trends.
- We used edit_host to tune timeouts per region, and reset_alerts to clear legacy incidents after changes.

This flow gives you continuous monitoring with custom agents and actionable, region-aware insights. Ready to try it with your own hosts and agents? Open the Quantum Network Monitor Assistant and start deploying local or cloud agents to build your comparative monitoring views today: https://readyforquantum.com/?assistant=open