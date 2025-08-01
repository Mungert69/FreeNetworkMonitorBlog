---
title: The AI Monitoring Assistant API
date: 2025-07-07T09:00:00
image: /blogpics/apipicgen/TheAIMonitoringAssistantAPI-ABD9Y68KNP.jpg
categories: ["API", "AI"]
featured: false
draft: false
questions:
  - "What API function do I use to add a new host for monitoring HTTP and HTTPS services?"
  - "How can I automatically retrieve the latest status of monitored endpoints every 10 minutes?"
  - "Is it possible to modify monitoring settings such as timeout or temporarily disable monitoring for an existing host?"
  - "How do I trigger a quantum vulnerability scan for an endpoint using the API?"
  - "What API call allows me to list all hosts currently monitored under my account?"
answers:
  - "You use the add_host function, specifying parameters like address, endpoint (http or https), port, timeout, and email. This registers the host for continuous monitoring."
  - "You can use the get_host_data function filtered by address and endpoint. Schedule this API call in your backend using a cron job or serverless timer to fetch and forward monitoring results periodically."
  - "Yes, you can use the edit_host function with the host's ID and your auth key to update specific fields like timeout or enabled status, allowing you to adjust monitoring parameters or pause monitoring."
  - "First, use get_agents to find agent locations that support quantum tests. Then call call_quantum_expert with a message describing the test (e.g., Kyber512 support on port 443) and specify the agent location to run the scan."
  - "Use the get_host_list function with filters such as your email address to retrieve configuration and status information for all hosts associated with your account."
---
Developers today look for flexible tools that don’t just automate tasks, but can be used as building blocks for broader solutions. The [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) provides a powerful API that allows developers to expand and integrate its AI monitoring and security capabilities directly into their own applications and workflows. In this blog post, we’ll walk through how a developer can leverage the Assistant’s functions to build custom monitoring, automate responses, and even add advanced security and quantum vulnerability checks into their own systems.

Let’s step through a realistic example dialog between a developer and the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open), demonstrating key API interactions along the way.

---

The developer’s goal: Build an integration that automates host onboarding, custom monitoring configuration, and periodic status retrieval — all while laying groundwork for security automation.

User: "I need to add a web service (api.mysaasplatform.com) for monitoring both HTTP and HTTPS, then get its current status to feed into my dashboard."

Assistant: "Let's start by registering both endpoints for monitoring. I’ll use add_host for each one. Here’s how I’d call the function for HTTP monitoring:"

```json
{
  "name": "add_host",
  "arguments": {
    "detail_response": true,
    "address": "api.mysaasplatform.com",
    "endpoint": "http",
    "port": 80,
    "timeout": 10000,
    "email": "dev@example.com"
  }
}
```

And for HTTPS:

```json
{
  "name": "add_host",
  "arguments": {
    "detail_response": true,
    "address": "api.mysaasplatform.com",
    "endpoint": "https",
    "port": 443,
    "timeout": 10000,
    "email": "dev@example.com"
  }
}
```

The assistant would send these calls, registering both HTTP and HTTPS services for continuous monitoring. Each call returns a host ID and (if not logged in) an auth key for later management.

User: "Great. How do I grab the latest status for these endpoints automatically every 10 minutes?"

Assistant: "You'll want to use get_host_data and filter by address and endpoint. Here’s what the API call would look like for the HTTP service:"

```json
{
  "name": "get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.mysaasplatform.com",
    "endpoint": "http"
  }
}
```

You can schedule this call in your integration backend (e.g., using a cron job or serverless timer) to collect and forward the monitoring results to your dashboard, ticket system, or other internal tools.

User: "Can I adjust monitoring parameters for an existing host? For example, increase the HTTPS timeout or temporarily pause monitoring?"

Assistant: "Absolutely. Use edit_host with the host's ID and your auth key, updating only the fields you wish to change. Here’s how you’d extend the HTTPS timeout to 20000ms:"

```json
{
  "name": "edit_host",
  "arguments": {
    "detail_response": true,
    "auth_key": "YOUR_AUTH_KEY_HERE",
    "id": 12345,
    "timeout": 20000
  }
}
```

And to temporarily disable monitoring:

```json
{
  "name": "edit_host",
  "arguments": {
    "detail_response": true,
    "auth_key": "YOUR_AUTH_KEY_HERE",
    "id": 12345,
    "enabled": false
  }
}
```

A positive response confirms the configuration change, allowing your automations or admin UI to stay in sync.

User: "I also want to add quantum vulnerability scans as an option my users can trigger for their endpoints."

Assistant: "First, enumerate agent locations that support quantum tests with get_agents. Then, to trigger a quantum test (say for Kyber512 support on port 443):"

```json
{
  "name": "call_quantum_expert",
  "arguments": {
    "message": "Test api.mysaasplatform.com:443 for Kyber512 support",
    "agent_location": "Scanner – EU"
  }
}
```

Your system can present the output from this call directly in your UI, giving users rich, real-time insights about post-quantum readiness.

User: "How do I list all currently monitored hosts for my integration client on demand?"

Assistant: "You’d use get_host_list with your filters (for example, by email):"

```json
{
  "name": "get_host_list",
  "arguments": {
    "detail_response": true,
    "email": "dev@example.com"
  }
}
```

This returns configuration and status info for all hosts under your account, enabling dynamic dashboards or synchronization with other asset management tools.

---

Each function — from basic monitoring (add_host, get_host_data) to advanced actions (edit_host, call_quantum_expert) — is available through straightforward API calls, whether you’re building Python scripts, custom CI/CD hooks, or dashboard integrations.

In summary, the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open)’s API isn’t just for UI users: it’s a developer-centric toolkit for automating network monitoring, orchestrating security assessments, and embedding cutting-edge quantum safety tests into any workflow. With simple function calls, you gain the power to build smarter infrastructure, safer services, and a dynamic, actionable view of your network’s health.

Ready to start building? Explore the API functions, try out sample calls, and see how seamlessly the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) can extend your current systems!