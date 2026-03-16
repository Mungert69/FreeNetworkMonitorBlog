---
title: Monitoring The Quantum Transition
date: 2025-08-03T09:00:00
image: /blogpics/apipicgen/monitoringthequantumtransition-P0F0821OOV.jpg
categories: ["Quantum Security", "Encryption"]
featured: false
draft: false
questions:
  - "What is the purpose of the Quantum Network Monitor Assistant?"
  - "How can I add a website or service for quantum-safe monitoring using the assistant?"
  - "How do I check which of my monitored hosts are still using classical cryptography versus quantum-resistant algorithms?"
  - "Can I update the monitoring profile of a host if its cryptography status changes?"
  - "Is it possible to get a report of hosts that have not yet transitioned to quantum-safe encryption?"
answers:
  - "The Quantum Network Monitor Assistant helps users track and monitor the transition of their digital assets from classical cryptography to quantum-resistant algorithms, ensuring their infrastructure is quantum-safe."
  - "You can add a host by using the add_host function with parameters including the host address, the 'quantum' endpoint to specify quantum-safe monitoring, and your email for alerts. For example: {\"detail_response\": true, \"address\": \"example.com\", \"endpoint\": \"quantum\", \"email\": \"user@example.com\"}."
  - "You can retrieve a detailed list of your monitored hosts using the get_host_list function with your email. The returned list includes an 'endpoint' field indicating whether each host uses classical protocols like HTTPS or quantum-resistant endpoints labeled 'quantum'."
  - "Yes, you can update a host's monitoring configuration using the edit_host function by specifying the host's ID, changing the endpoint to 'quantum' or another appropriate value, and including your email. This keeps the monitoring data current."
  - "Yes, by requesting monitoring data with an alert_flag set to true, the assistant can provide a report highlighting hosts that triggered alerts due to lack of quantum-resistance, helping prioritize upgrades."
---
Transitioning to a quantum-safe infrastructure is a vital priority for organizations seeking resilience in the face of advancing quantum computing technologies. In this blog post, we’ll walk through how a user can leverage the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) to track and monitor the shift from classical cryptography to quantum-resistant algorithms across their digital assets—a process we’ll refer to as “Monitoring the Quantum Transition”.

Let’s follow a realistic conversation as a user interacts with the assistant to achieve this goal, highlighting how the assistant’s specialized function calls can help.

---

User: I want to monitor which of my websites and services are already using quantum-resistant algorithms and which still rely on classical cryptography. How should I start?

Assistant: That’s a smart and proactive step! To begin, you can use the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) to add your websites and services for ongoing monitoring. By selecting the “quantum” endpoint, the Assistant tests for deployment of quantum-safe encryption. Let’s start by adding one of your hosts—say, example.com—for monitoring using the quantum check.

We’ll use the add_host function for this purpose:

```json
{
  "detail_response": true,
  "address": "example.com",
  "endpoint": "quantum",
  "email": "user@example.com"
}
```

This command will set up quantum-safety monitoring for the specified host and ensure you’re alerted by email about its cryptographic status.

---

User: Can I see which services still use classical cryptography and a list of my monitored hosts?

Assistant: Absolutely. To help you track your transition, let’s get a detailed list of all your currently monitored hosts and filter those using either classical (e.g., HTTPS/TLS) or quantum-resistant endpoints.

Here’s how the assistant retrieves your host list—including endpoint types—using get_host_list:

```json
{
  "detail_response": true,
  "email": "user@example.com"
}
```

By reviewing the endpoint field in the returned list, you can distinguish which hosts are monitored for quantum safety (“quantum” endpoint) and which are on legacy protocols (“https”, “smtp”, etc.).

---

User: I just learned we upgraded our mail server to quantum-safe encryption. Can I update its monitoring profile to reflect this?

Assistant: You sure can! Simply update the monitoring configuration for your mail server, changing its endpoint to “quantum”. Here’s how the assistant would do it:

```json
{
  "detail_response": true,
  "id": 42,
  "endpoint": "quantum",
  "email": "user@example.com"
}
```

(Here, id: 42 is a placeholder for your actual mail server’s host ID, which you would find in your host list.)

This switch keeps your monitoring current with your infrastructure’s cryptography status.

---

User: I’d like a report showing which hosts have transitioned and which haven’t—can the assistant help?

Assistant: Definitely! You can request monitoring data, including alerts on which hosts have successfully made the quantum leap and which are pending. For example, to see hosts that triggered an alert due to lack of quantum-resistance:

```json
{
  "detail_response": true,
  "alert_flag": true,
  "email": "user@example.com"
}
```

Reviewing these results helps you prioritize upgrades and coordinate with teams managing lagging services.

---

To summarize: By adding, listing, editing, and retrieving the monitoring status of your assets, the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) offers a hands-on approach to tracking your organization’s progress from classical to quantum-resilient infrastructure. Each function—like add_host for registering assets, get_host_list and get_host_data for visibility and reporting, and edit_host for updating status—empowers you to manage and accelerate your quantum transition with ease.

Ready to start your transition journey? Try the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) today and make quantum resilience a reality for your organization!