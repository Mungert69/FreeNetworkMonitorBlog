---
title: How To Add And Edit Hosts With The Assistant
date: 2025-10-28T09:00:00
image: /blogpics/apipicgen/howtoaddandedithostswiththeassistant-G9GDJNPRRQ.jpg
categories: ["Host Management", "Automation"]
featured: false
draft: false
questions:
  - "Why does the assistant call get_agents before adding a host?"
  - "What is the auth_key used for after a host is added?"
  - "When should I use HTTPS monitoring instead of an Nmap scan?"
  - "How can I confirm that moving the monitoring agent actually changed performance results?"
  - "How do I verify the current saved configuration for a monitored host?"
answers:
  - "It uses get_agents to see which monitoring locations are available so it can choose the best vantage point for the user’s goal, such as monitoring from Europe or the U.S."
  - "The auth_key is used to authorize future changes to the host configuration, especially when the user is not logged in. For example, it can be included in edit_host requests to change the endpoint type or agent location."
  - "HTTPS monitoring is best for lightweight uptime, latency, and SSL certificate visibility. Nmap is better when you want a deeper service profile, such as discovering open ports and identifying services running on them."
  - "After updating the agent location with edit_host, the assistant calls get_host_data again to fetch the latest measurement. You can then compare values like response_time_ms before and after the move."
  - "You can use get_host_list with the host address to retrieve its stored configuration, including fields like endpoint, port, enabled status, and agent location."
---
Here’s a practical, end-to-end walkthrough showing how a network engineer can use the Quantum Network Monitor Assistant to add a device, change its monitoring endpoint, and update the agent location—all by having a natural conversation with the assistant. Throughout, we’ll show the exact API-style function calls the assistant makes under the hood and how the results guide the next steps. You can try all of this yourself via the Quantum Network Monitor Assistant: https://readyforquantum.com/?assistant=open

Scenario overview
- Goal: Add a new host for monitoring, verify it’s working, switch its endpoint type, and then move it to a different monitoring agent location.
- Key functions we’ll use:
  - get_agents: Lists available monitoring agents/locations.
  - add_host: Registers a new device (host) to be monitored.
  - get_host_data: Retrieves latest monitoring results for a host.
  - get_host_list: Retrieves current host configuration(s).
  - edit_host: Updates an existing host (endpoint type, agent, port, timeout, etc.).

Step 1: Find an agent location to run the checks
User: I want to monitor my API endpoint api.acme.com from Europe. Can you add it?

Assistant rationale: We’ll first list available agents so the user can pick the best location. We’ll call get_agents, which returns agent names and capabilities.

Function call
```json
{
  "name": "get_agents",
  "arguments": {
    "detail_response": false
  }
}
```

How we use the response
- The assistant receives a list such as: ["Scanner - EU", "Scanner - US-East", "Scanner - APAC", "Home Office - Laptop (ops@acme.io)"].
- Since the user wants Europe, we’ll select "Scanner - EU".

Assistant: I can see these locations: Scanner - EU, Scanner - US-East, Scanner - APAC, and your local agent. I’ll use Scanner - EU for your checks. Do you want a simple HTTPS check or a deeper service scan?

Step 2: Register the host with an HTTPS endpoint
User: Start with a basic HTTPS check. Alert me at ops@acme.io.

Assistant rationale: We’ll register the host using add_host. For users not logged in, add_host accepts an email so alerts can be sent and an auth_key can be issued for later edits.

Function call
```json
{
  "name": "add_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "https",
    "port": 443,
    "timeout": 30000,
    "email": "ops@acme.io",
    "agent_location": "Scanner - EU",
    "detail_response": true
  }
}
```

How we use the response
- Typical response includes: success: true, id: 1042, address: "api.acme.com", endpoint: "https", port: 443, agent_location: "Scanner - EU", auth_key: "ak_7b1e…".
- We store the auth_key securely for future edits if the user isn’t logged in.

Assistant: api.acme.com has been added for HTTPS monitoring from Scanner - EU. I’ve issued you an auth key for future changes. I’ll pull the latest check results next.

Step 3: Verify the new host is running and healthy
Assistant rationale: We’ll fetch the latest measurement using get_host_data with dataset_id 0 (latest). This confirms the endpoint is reachable and gives a quick health picture.

Function call
```json
{
  "name": "get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "api.acme.com",
    "detail_response": true
  }
}
```

How we use the response
- Example results: status: "up", response_time_ms: 182, ssl_days_remaining: 64, last_check: "2026-03-14T03:02:41Z", agent_location: "Scanner - EU".
- The assistant reports back the status and any noteworthy metrics.

Assistant: The latest HTTPS check is up (182 ms) with 64 days left on the certificate. Monitoring looks good. Would you like to change the endpoint type for a deeper look?

Step 4: Change the endpoint type (e.g., to an Nmap service scan)
User: Yes—switch it to an Nmap service scan on the top 100 ports to profile services.

Assistant rationale: We’ll update the existing host using edit_host. If the user isn’t logged in, include the auth_key obtained from add_host. We’ll also pass additional flags in args.

Function call
```json
{
  "name": "edit_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "nmap",
    "args": "--top-ports 100 -sV -Pn",
    "timeout": 59000,
    "agent_location": "Scanner - EU",
    "auth_key": "ak_7b1e…",
    "detail_response": true
  }
}
```

How we use the response
- Typical response: success: true, endpoint changed to "nmap", args accepted, timeout 59000, same agent location.
- The assistant confirms the change and, once a run is complete, will show a summary of open services.

Assistant: I’ve switched api.acme.com to an Nmap service scan (top 100 ports, service detection enabled). I’ll fetch results as they arrive.

Step 5: Review the updated results
Assistant rationale: We’ll call get_host_data again to see what the new endpoint returned.

Function call
```json
{
  "name": "get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "api.acme.com",
    "detail_response": true
  }
}
```

How we use the response
- Example results: open_ports: [\{port: 443, service: "https", product: "nginx 1.25"\}, \{port: 22, service: "ssh", product: "OpenSSH 9.x"\}], last_check: "2026-03-14T03:06:10Z".
- The assistant summarizes the discovered services.

Assistant: The scan found 443/tcp (HTTPS: nginx 1.25) and 22/tcp (SSH: OpenSSH 9.x). Do you want to keep it on Nmap, or return to HTTPS monitoring?

Step 6: Update the agent location (e.g., move checks closer to users in the U.S.)
User: Move monitoring to the U.S. East agent and put it back on HTTPS.

Assistant rationale: We’ll:
1) Change endpoint back to https.
2) Update agent_location to "Scanner - US-East".
We’ll use edit_host again.

Function call
```json
{
  "name": "edit_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "https",
    "port": 443,
    "agent_location": "Scanner - US-East",
    "timeout": 30000,
    "auth_key": "ak_7b1e…",
    "detail_response": true
  }
}
```

How we use the response
- Typical response: success: true, endpoint "https", port 443, agent_location "Scanner - US-East", timeout 30000 confirmed.
- We’ll refresh latest results to confirm the new agent’s perspective.

Assistant: Done—HTTPS monitoring is now running from Scanner - US-East. I’ll fetch the latest measurement so you can compare latency from the U.S.

Verification after move
Function call
```json
{
  "name": "get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "api.acme.com",
    "detail_response": true
  }
}
```

How we use the response
- Example results: status: "up", response_time_ms: 133 (lower from US-East), last_check: "2026-03-14T03:08:32Z".
- The assistant reports improved response time from the new region.

Assistant: From US-East, HTTPS responded in 133 ms. Looks a bit faster than EU for your U.S. users.

Bonus: Quickly confirm the active configuration
User: Can you show me the current config, just to be sure?

Assistant rationale: We’ll use get_host_list to summarize the host’s stored configuration (address, endpoint, port, enabled state, agent location).

Function call
```json
{
  "name": "get_host_list",
  "arguments": {
    "address": "api.acme.com",
    "detail_response": true
  }
}
```

How we use the response
- Example output: [\{id: 1042, address: "api.acme.com", endpoint: "https", port: 443, enabled: true, agent_location: "Scanner - US-East"\}].
- The assistant presents this as a tidy confirmation.

Assistant: Here’s the current configuration—api.acme.com, endpoint https, port 443, enabled true, agent Scanner - US-East.

What each function did for us
- get_agents: Listed available monitoring locations to choose the best vantage point.
- add_host: Registered a new device for monitoring and returned an auth_key we can reuse for edits if not logged in.
- get_host_data: Pulled the latest check results to validate availability and performance, and to view scan findings.
- edit_host: Changed the endpoint type (HTTPS to Nmap and back), updated timeouts, and moved the agent location.
- get_host_list: Confirmed the stored configuration after edits.

Tips for your own workflow
- Not logged in? Provide an email during add_host so you receive alerts and an auth_key for subsequent edits.
- Pick the right endpoint type:
  - https/http: Lightweight uptime/latency and SSL visibility (for https).
  - icmp: Quick host ping checks.
  - nmap/nmapvuln: Enriched service and basic vulnerability discovery.
  - rawconnect: Low-level connection testing for bespoke ports.
- Move agent locations to measure real user performance across regions or to keep scans closer to target environments.
- Keep timeouts appropriate for your endpoint type; heavier scans like Nmap may need the full default window.

Conclusion
In a few assistant-guided steps, we registered a new device, verified its health, switched to an in-depth service scan, and then moved monitoring to a different region—all by leveraging concise API-style calls through conversation. To try this workflow with your own hosts, open the Quantum Network Monitor Assistant: https://readyforquantum.com/?assistant=open