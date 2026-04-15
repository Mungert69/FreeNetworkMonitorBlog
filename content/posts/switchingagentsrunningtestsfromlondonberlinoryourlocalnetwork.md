---
title: Switching Agents Running Tests From London Berlin Or Your Local Network
date: 2025-11-13T09:00:00
image: /blogpics/apipicgen/switchingagentsrunningtestsfromlondonberlinoryourlocalnetwork-RAL4ZSCVK1.jpg
categories: ["Agents", "Network Coverage"]
featured: false
draft: false
questions:
  - "How do I find which locations or agents I can run monitors from?"
  - "How can I move an existing monitor from London to Berlin without creating a new one?"
  - "What is the difference between switching a monitor's location and creating a second monitor?"
  - "Why would I use a local agent instead of a cloud scanner?"
  - "How do I view the latest results for a monitor from a specific location?"
answers:
  - "Use the get_agents function. It returns the available cloud scanners, such as London and Berlin, plus any local agents connected to your account. If no local agent appears, you likely need to install one first."
  - "Use edit_host with the monitor's id and set agent_location to the new location, such as \"Scanner - Berlin (DE)\". This updates the same monitor so future checks run from Berlin instead of London."
  - "Switching the location with edit_host moves the existing monitor to a new vantage point, so it no longer runs from the old one. Creating a second monitor with add_host lets you keep both locations active at the same time for side-by-side comparisons."
  - "A local agent can test private IPs and internal services on your LAN that public cloud agents cannot reach. It's useful for monitoring internal app servers, firewall-restricted systems, and other non-public infrastructure."
  - "Use get_host_data with dataset_id set to 0 for the latest data, and include both the address and agent_location. That lets you retrieve metrics such as availability, status code, TLS handshake time, and response time from the exact vantage point you want."
---
In this hands-on walkthrough, we’ll show how a network engineer used the Quantum Network Monitor Assistant to run the same checks from different agent locations—London, Berlin, and their own local network—simply by switching the agent_location parameter in API-style calls. Along the way, we’ll demonstrate the core function calls you’ll use most: listing agents (get_agents), creating monitors (add_host), viewing results (get_host_data), and changing where a monitor runs (edit_host). If you want to try this flow live, open the Quantum Network Monitor Assistant and follow along.

Step 1: Discover which agents you can use
User → “Which agents can I run tests from?”

Assistant → “Let’s list available agents. You’ll typically see several cloud scanners (e.g., London, Berlin) plus any local agents tied to your account for internal monitoring.”

We call get_agents to enumerate the locations you can target. This function lists agents and their capabilities, including identifiers for your local agents.

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
- We parse the returned list to display agent locations, e.g.:
  - “Scanner - London (UK)”
  - “Scanner - Berlin (DE)”
  - “MyLaptop - Home (you@company.com)” (a local agent for internal checks)
- If you don’t see a local agent, the assistant will point you to install one from the download page so you can test devices on your LAN.

Step 2: Run a global HTTPS check from London
User → “Monitor https://example.com from London so I can see external user experience.”

Assistant → “We’ll add a new monitor using the https endpoint and target the London agent. If you’re not logged in, include your email for alerts.”

We use add_host to create the monitor and set agent_location to “Scanner - London (UK).” The https endpoint checks SSL/TLS viability and site responsiveness.

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "example.com",
    "endpoint": "https",
    "agent_location": "Scanner - London (UK)",
    "timeout": 10000,
    "email": "ops@example.com"
  }
}
```

How we use the response
- We record the host id (e.g., 123) returned by the service for future edits.
- If you’re unauthenticated, the response also includes an auth_key—store it so you can edit or delete this monitor later.

Step 3: View the latest results from London
User → “Show me how it’s performing from London.”

Assistant → “We’ll grab the latest dataset (dataset_id: 0) for this address and location.”

We use get_host_data to fetch the most recent state and metrics. Filtering by agent_location ensures we retrieve London’s vantage point.

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "example.com",
    "agent_location": "Scanner - London (UK)"
  }
}
```

How we use the response
- We summarize availability, status code, TLS handshake time, response time, and any alerts.
- If latency looks high from London, we note it for comparison against Berlin next.

Step 4: Switch the same monitor to Berlin
User → “Now switch that exact monitor to run from Berlin.”

Assistant → “We’ll update the existing host’s agent_location using edit_host. This ‘moves’ the monitor to a new vantage point.”

Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 123,
    "agent_location": "Scanner - Berlin (DE)"
  }
}
```

How we use the response
- We confirm the agent_location update was applied.
- On the next run, the service collects results from Berlin rather than London.

Step 5: Compare London vs. Berlin side-by-side
User → “I want to compare both at once.”

Assistant → “We’ll keep your existing London monitor and add a second Berlin monitor. Then we’ll pull the latest data for both to compare.”

First, add a second monitor for Berlin (same target, different agent_location):

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "example.com",
    "endpoint": "https",
    "agent_location": "Scanner - Berlin (DE)",
    "timeout": 10000,
    "email": "ops@example.com"
  }
}
```

Then, fetch the latest data for each location:

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "example.com",
    "agent_location": "Scanner - London (UK)"
  }
}
```

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "example.com",
    "agent_location": "Scanner - Berlin (DE)"
  }
}
```

How we use the response
- We align key metrics and discuss differences (e.g., response time, SSL handshake, packet loss).
- If Berlin shows higher latency or intermittent timeouts compared to London, that points to a regional CDN issue or upstream route variance.

Step 6: Run an internal check from your local network
User → “I also need to monitor an internal app server at 192.168.1.10.”

Assistant → “We’ll use your local agent for this ICMP (ping) check. If your list didn’t show a local agent, install one and it will appear under your email.”

We add a monitor targeting your local agent:

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "192.168.1.10",
    "endpoint": "icmp",
    "agent_location": "MyLaptop - Home (you@company.com)",
    "timeout": 5000,
    "email": "ops@example.com"
  }
}
```

How we use the response
- We confirm the local monitor is registered and enabled.
- Subsequent results verify reachability from inside your LAN, which external agents can’t access.

Optional quick diagnostics from your local agent
If you want a one-off check (not continuous monitoring), the assistant can run safe BusyBox network commands via your local agent for things like pings or traceroutes on your trusted LAN.

Function call
```json
{
  "name": "functions.run_busybox_command",
  "arguments": {
    "command": "ping -c 4 192.168.1.10",
    "agent_location": "MyLaptop - Home (you@company.com)",
    "number_lines": 50
  }
}
```

How we use the response
- We read packet loss and average latency to validate the monitor’s findings.
- For routing anomalies, we might run traceroute or inspect the ARP table similarly.

Step 7: Run a targeted service scan from Berlin (optional)
User → “From Berlin, can we verify the service and banner on 443?”

Assistant → “We can use an nmap monitor. It’s useful for periodic validation of exposed services from a specific region.”

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "example.com",
    "endpoint": "nmap",
    "args": "-sV -p 443",
    "agent_location": "Scanner - Berlin (DE)",
    "timeout": 30000,
    "email": "ops@example.com"
  }
}
```

How we use the response
- We review reported service/version on 443 and watch for unexpected changes over time.
- If a service or cipher suite drifts, we can alert and respond accordingly.

Step 8: Switch, pause, or delete as needs change
User → “Disable the Berlin HTTPS test for now.”

Assistant → “We’ll toggle enabled or remove it if you prefer a clean slate.”

To disable a host:
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 456,
    "enabled": false
  }
}
```

To delete it later:
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 456,
    "hidden": true
  }
}
```

How we use the response
- We confirm the state change and ensure alerts are silenced or the monitor is removed.

Why agent selection matters
- London vs. Berlin: See regional CDN and DNS behavior, TLS performance, and routing changes that impact different user populations.
- Local agent: Validate internal apps, private IPs, and firewall-controlled services that the public internet can’t reach.
- Consistency: Same endpoint definition, different agent_location. This isolates location from configuration, making comparisons straightforward.

Key functions recap
- get_agents: Lists cloud and local agents so you can choose a vantage point.
- add_host: Creates a monitor; include agent_location to run it from London, Berlin, or your local network.
- get_host_data: Retrieves results; filter by address and agent_location for precise views.
- edit_host: Switches agent_location, toggles enabled, or deletes the monitor.
- run_busybox_command: Runs ad-hoc diagnostics on a local agent for quick checks in trusted environments.

Closing
By explicitly choosing agent_location in each call, you can pivot seamlessly across London, Berlin, or your own LAN to validate availability, performance, and configuration from the right vantage point. Ready to try it? Open the Quantum Network Monitor Assistant, ask it to “list agents,” and start switching locations in your next test run.