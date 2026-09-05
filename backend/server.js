const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// -------------------------
// Product Catalog
// -------------------------
const products = [
  {
    id: 1,
    name: "Wireless Keyboard",
    price: 1499,
    category: "keyboard",
    description: "Slim wireless keyboard suitable for office work",
  },
  {
    id: 2,
    name: "Wireless Mouse",
    price: 399,
    category: "mouse",
    description: "Ergonomic wireless mouse for everyday work",
  },
  {
    id: 3,
    name: "Laptop Stand",
    price: 899,
    category: "accessories",
    description: "Adjustable aluminum laptop stand",
  },
  {
    id: 4,
    name: "USB-C Hub",
    price: 1299,
    category: "accessories",
    description: "6-in-1 USB-C hub for laptops",
  },
  {
    id: 5,
    name: "Mechanical Keyboard",
    price: 2499,
    category: "keyboard",
    description: "Mechanical keyboard with tactile switches",
  },
  {
    id: 6,
    name: "Gaming Mouse",
    price: 1799,
    category: "mouse",
    description: "High precision mouse for gaming and productivity",
  },
  {
    id: 7,
    name: "Webcam",
    price: 1599,
    category: "webcam",
    description: "1080p webcam for meetings and online classes",
  },
  {
    id: 8,
    name: "Desk Mat",
    price: 499,
    category: "accessories",
    description: "Large desk mat for keyboard and mouse",
  },
];

// -------------------------
// Basic Routes
// -------------------------

app.get("/", (req, res) => {
  res.json({
    message: "RazorSell AI backend is running 🚀",
  });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

// -------------------------
// Product Search
// -------------------------

app.get("/api/products/search", (req, res) => {
  const query = (req.query.q || "").toLowerCase();

  const results = products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
  );

  res.json(results);
});

// -------------------------
// AI Sales Agent
// -------------------------

app.post("/api/agent/chat", (req, res) => {
  const message = (req.body.message || "").toLowerCase();

  let matches = [];

  const budgetMatch = message.match(
    /(?:under|below|less than|within)\s*₹?\s*(\d+)/
  );

  const budget = budgetMatch ? Number(budgetMatch[1]) : null;

  const categories = ["keyboard", "mouse", "webcam", "accessories"];

  for (const product of products) {
    const categoryMatch = categories.some(
      (category) =>
        message.includes(category) || product.name.toLowerCase().includes(category)
    );

    const textMatch =
      message.includes(product.name.toLowerCase()) ||
      message.includes("work") ||
      message.includes("office");

    const budgetMatchProduct =
      budget === null || product.price <= budget;

    if ((categoryMatch || textMatch) && budgetMatchProduct) {
      matches.push(product);
    }
  }

  if (matches.length === 0) {
    matches = products.filter(
      (product) => budget === null || product.price <= budget
    );
  }

  if (matches.length === 0) {
    return res.json({
      message: "I couldn't find a product within that budget.",
      recommendation: null,
      upsell: null,
      nextStep: "Ask the customer for a higher budget.",
    });
  }

  const recommendation = matches[0];

  let upsell = null;

  if (recommendation.category === "keyboard") {
    upsell = products.find((product) => product.id === 2);
  } else if (recommendation.category === "mouse") {
    upsell = products.find((product) => product.id === 1);
  } else {
    upsell = products.find((product) => product.id === 8);
  }

  addAuditLog("RECOMMENDATION", {
    product: recommendation.name,
    price: recommendation.price,
    budget,
  });

  const reason =
  budget !== null
    ? `${recommendation.name} matches your requested category and stays within your ₹${budget} budget.`
    : `${recommendation.name} matches the product you're looking for and is a strong fit for your request.`;

const upsellReason = upsell
  ? `${upsell.name} complements the ${recommendation.name} and can improve the overall setup.`
  : null;

res.json({
  message: `Based on your request, I recommend the ${recommendation.name} for ₹${recommendation.price}. ${reason}`,
  recommendation,
  upsell,
  reason,
  upsellReason,
  budget,
  nextStep:
    "Customer confirmation is required before creating a payment.",
});
});

// -------------------------
// CREATE DEMO PAYMENT
// -------------------------

app.post("/api/payment/create", (req, res) => {
  const { recommendation, upsell, simulateFailure } = req.body;

  if (!recommendation) {
    return res.status(400).json({
      success: false,
      message: "No product selected.",
    });
  }

  const total =
    recommendation.price + (upsell ? upsell.price : 0);

  const transactionId = `TXN-${Date.now()}`;

  addAuditLog("PAYMENT_ATTEMPT", {
    transactionId,
    product: recommendation.name,
    upsell: upsell ? upsell.name : null,
    amount: total,
  });

  // Deterministic failure for demo
  if (simulateFailure === true) {
    addAuditLog("PAYMENT_FAILED", {
      transactionId,
      amount: total,
      reason: "Simulated payment failure",
    });

    return res.json({
      success: false,
      transactionId,
      amount: total,
      status: "FAILED",
      message:
        "Payment failed safely. No order was completed. You can retry.",
      retryAvailable: true,
    });
  }

  addAuditLog("PAYMENT_SUCCESS", {
    transactionId,
    amount: total,
  });

  res.json({
    success: true,
    transactionId,
    amount: total,
    status: "SUCCESS",
    message: "Demo payment completed successfully.",
  });
});

// -------------------------
// Persistent Audit Log
// -------------------------

const auditLogFile = path.join(__dirname, "audit-log.json");

let auditLogs = [];

// Load existing audit logs when server starts
try {
  if (fs.existsSync(auditLogFile)) {
    const savedLogs = fs.readFileSync(auditLogFile, "utf8");

    auditLogs = savedLogs ? JSON.parse(savedLogs) : [];
  }
} catch (error) {
  console.error("Could not load audit logs:", error);
  auditLogs = [];
}

function saveAuditLogs() {
  try {
    fs.writeFileSync(
      auditLogFile,
      JSON.stringify(auditLogs, null, 2)
    );
  } catch (error) {
    console.error("Could not save audit logs:", error);
  }
}

function addAuditLog(type, details) {
  const log = {
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type,
    ...details,
  };

  auditLogs.push(log);

  saveAuditLogs();

  console.log("AUDIT:", log);

  return log;
}

// -------------------------
// Audit Log API
// -------------------------

app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// -------------------------
// Server
// -------------------------

app.listen(PORT, () => {
  console.log(`RazorSell backend running at http://localhost:${PORT}`);
});