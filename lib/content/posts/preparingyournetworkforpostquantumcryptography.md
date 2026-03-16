---
title: Preparing Your Network For Post-Quantum Cryptography
date: 2025-06-04T09:00:00
image: /blogpics/apipicgen/PreparingYourNetworkForPostQuantumCryptography-XYD1Y9V33B.jpg
categories: ["Quantum Security", "Encryption"]
featured: false
draft: false
questions:
  - "What is the first step to check if my website supports post-quantum encryption using the Quantum Network Monitor Assistant?"
  - "How can I find out if my server supports post-quantum algorithms like Kyber or Dilithium2?"
  - "What should I do if my server does not have Kyber512 enabled and only uses traditional TLS?"
  - "Is it possible to receive alerts if my server's quantum cryptography status changes?"
  - "Can I monitor multiple servers at once for quantum readiness?"
answers:
  - "The first step is to add your website host (e.g., companyexample.com) to the Quantum Network Monitor Assistant for quantum monitoring by using the add_host function with the endpoint type set to 'quantum'. This registers your site for automated scans to check for quantum-safe cryptographic protection."
  - "After adding your host for monitoring, you can retrieve the latest quantum assessment results by using the get_host_data function. This will show whether your server supports post-quantum key encapsulation mechanisms (KEMs) such as Kyber or Dilithium2, and highlight any vulnerabilities."
  - "You can use the call_quantum_expert function to get tailored recommendations from the integrated quantum security expert. This will provide specific actions like configuration changes, firmware updates, certificate replacements, and vendor guidance to enable Kyber512 and implement post-quantum-safe configurations."
  - "Yes, when you add a host for continuous quantum monitoring, you can set up email notifications to alert you of any changes in your server’s quantum cryptography status, helping you stay informed about your exposure to quantum threats."
  - "Absolutely. You can add multiple hosts by repeating the add_host process for each server. Using functions like get_host_list and get_host_data, you can monitor and analyze quantum vulnerabilities and trends across your entire network."
---
As post-quantum cryptography becomes a necessity in today’s world, network professionals and security-conscious users must take action to prepare their systems for quantum-safe standards. In this blog post, we’ll walk you through a hands-on example using the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) to evaluate your network’s readiness for post-quantum encryption, step by step. Our focus is on practical actions to help future-proof your network’s encryption infrastructure.

Introduction: Getting Started with Quantum-Safety Checks

Let’s imagine you’re responsible for securing your organization’s main website, companyexample.com, and want to know if it’s protected with post-quantum cryptography. You want clear answers: Does your server support quantum-safe algorithms? Are your TLS endpoints exposed to quantum threats? Here’s how you can use the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) to find out.

Step 1: Add Your Host for Quantum Monitoring

User:  
I want to check if companyexample.com is ready for post-quantum encryption. What do I do first?

Assistant:  
Great first step! To monitor this host for quantum readiness, we’ll add companyexample.com and set the endpoint type to 'quantum' so the assistant can actively check for post-quantum cryptographic protection.

Here's the function that sets up monitoring:
```json


{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "companyexample.com",
    "endpoint": "quantum",
    "email": "your@email.com"
  }
}
```

We use add_host to register companyexample.com for quantum-safe testing. This setup enables automated scans for quantum-vulnerable ports and checks for current post-quantum algorithm support.

Step 2: Retrieve Results and Analyze

User:  
How do I see if quantum-safe algorithms like Kyber or Dilithium2 are supported?

Assistant:  
Once your host is being monitored, you’ll want to pull up the latest quantum assessment details. I’ll request the most recent scan data for your host:
```json


{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "companyexample.com"
  }
}
```

We use get_host_data to retrieve up-to-date monitoring results. The assistant reviews the findings: Does the scan confirm support for post-quantum KEMs such as Kyber or Dilithium2? If not, it will flag which protocols are missing or vulnerable. These insights tell you exactly where upgrades are required.

Step 3: Get Tailored Recommendations

User:  
My results say Kyber512 isn’t enabled and my server is using only traditional TLS. What next?

Assistant:  
You’re on the right track! Now, let’s go a step further and ask the integrated quantum security expert for actionable recommendations, including configuration changes or vendor guidance.
```json


{
  "name": "functions.call_quantum_expert",
  "arguments": {
    "message": "Please review companyexample.com and provide specific actions to enable Kyber512 and post-quantum-safe configuration on all web-facing TLS ports.",
    "agent_location": "Scanner - EU"
  }
}
```

The assistant leverages call_quantum_expert to deliver a concise action plan. Expect guidance on firmware updates, certificate replacement, and which vendors support post-quantum algorithms.

Step 4: Continuous Monitoring and Alerts

User:  
Can I get alerts if my server’s quantum status changes?

Assistant:  
Absolutely. When you add a host for ongoing quantum monitoring, you can set up email notifications for any changes in your quantum cryptography status. This way, you’ll always know if your organization’s exposure to quantum threats shifts.

Step 5: Expand to Multiple Systems

User:  
I also have other servers; can I check them all together?

Assistant:  
Definitely. You can add multiple hosts by repeating the add_host process for each address and endpoint. The get_host_list and get_host_data functions make it easy to monitor trends and vulnerabilities across your entire network.

Conclusion: Future-Proofing Starts Now

By using [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open)’s quantum assessment features, you can identify where your encryption needs upgrading, receive clear remediation steps, and maintain vigilance with automatic monitoring. This practical approach positions you ahead of the quantum security curve—all with just a few guided steps. Ready to try it yourself? Start by adding your key hosts for quantum monitoring and let the assistant help you build quantum-resilient defenses, today!