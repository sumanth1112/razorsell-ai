\# RazorSell AI



> An AI-powered sales agent that helps merchants increase conversions through personalized product recommendations, explainable cross-sells, confirmation-gated checkout, and an auditable payment workflow.



\## 🚀 Overview



RazorSell AI is a lightweight agentic-commerce MVP designed around a simple idea:



\*\*Let an AI sales assistant help a customer discover the right product and increase order value, while keeping every money-related action bounded and explicitly confirmed by the customer.\*\*



The agent can understand a customer's request, identify a suitable product from the merchant catalog, recommend a complementary product, explain why the recommendation was made, and guide the customer toward checkout.



Before any payment is created, the customer must explicitly confirm the transaction.



The project also demonstrates safe payment failure handling and a persistent audit trail.



\---



\## 🎯 Problem



Traditional online stores often make customers:



1\. Browse through large catalogs.

2\. Compare products manually.

3\. Decide what accessories they need themselves.

4\. Navigate several checkout steps.



This creates friction and missed opportunities for merchants.



RazorSell AI turns this into a conversational flow:



\*\*Customer request → Product discovery → Recommendation → Explainable cross-sell → Customer confirmation → Payment → Audit trail\*\*



\---



\## ✨ Key Features



\### 🤖 AI-style Sales Agent



Customers can describe what they need naturally.



Example:



> "I need a keyboard under ₹2000"



The agent identifies a suitable product based on the customer's request and budget.



\### 💡 Explainable Recommendations



The system does not simply recommend a product.



It explains why the product was selected, for example:



> "This product matches your requested category and stays within your ₹2000 budget."



\### 🔄 Cross-Selling



The agent can recommend a complementary product.



For example:



\*\*Wireless Keyboard → Wireless Mouse\*\*



The cross-sell is also accompanied by an explanation.



\### 🔐 Confirmation-Gated Payments



The AI agent cannot silently create a payment.



The customer must explicitly review and confirm the purchase before the payment workflow begins.



\### 💳 Demo Payment Simulator



The project currently uses a local demo payment simulator rather than processing real money.



It supports:



\- Successful payment

\- Simulated payment failure

\- Safe failure handling

\- Retry after failure

\- Transaction IDs

\- Payment status



The payment layer is intentionally separated so that a Razorpay test-mode adapter can be connected when merchant/test credentials are available.



\### 🧾 Persistent Audit Trail



Every important payment/recommendation event is recorded.



The audit trail captures information such as:



\- Event type

\- Timestamp

\- Product

\- Cross-sell

\- Amount

\- Transaction ID

\- Recommendation reason

\- Failure reason



Audit records are persisted locally in:



`backend/audit-log.json`



\---



\## 🏗️ Architecture



```text

&#x20;                   ┌──────────────────────┐

&#x20;                   │     Customer         │

&#x20;                   │  Natural Language    │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │   React Frontend     │

&#x20;                   │   RazorSell AI UI    │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                        REST API

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │  Node.js / Express   │

&#x20;                   │    Sales Agent       │

&#x20;                   └───────┬───────┬──────┘

&#x20;                           │       │

&#x20;                 ┌─────────┘       └─────────┐

&#x20;                 ▼                           ▼

&#x20;       ┌──────────────────┐        ┌──────────────────┐

&#x20;       │ Merchant Catalog │        │ Payment Simulator│

&#x20;       │   In-memory      │        │  Success/Failure │

&#x20;       └──────────────────┘        └─────────┬────────┘

&#x20;                                             │

&#x20;                                             ▼

&#x20;                                  ┌────────────────────┐

&#x20;                                  │ Persistent Audit   │

&#x20;                                  │      Trail         │

&#x20;                                  └────────────────────┘

