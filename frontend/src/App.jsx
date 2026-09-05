import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");

  const [chat, setChat] = useState([
    {
      type: "agent",
      text: "Hi! I'm RazorSell AI. Tell me what you're looking for and your budget."
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [upsell, setUpsell] = useState(null);

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;

    setChat((prev) => [
      ...prev,
      {
        type: "user",
        text: userMessage
      }
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/agent/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: userMessage
          })
        }
      );

      const data = await response.json();

      setChat((prev) => [
        ...prev,
        {
          type: "agent",
          text: data.message
        }
      ]);

      setRecommendation(data.recommendation);
      
      // Fixed: backend returns upsell directly
      setUpsell(data.upsell || null);

    } catch (error) {
      console.error(error);

      setChat((prev) => [
        ...prev,
        {
          type: "agent",
          text: "Sorry, I couldn't connect to the sales agent."
        }
      ]);
    }

    setLoading(false);
  };

  const fetchAuditLogs = async () => {
  try {
    const response = await fetch(
      "http://localhost:5000/api/audit-logs"
    );

    const data = await response.json();

    setAuditLogs(data);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
  }
};

useEffect(() => {
  fetchAuditLogs();
}, []);

  const createPayment = async (simulateFailure = false) => {
    if (!recommendation) return;

    setPaymentLoading(true);
    setPaymentStatus(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/payment/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            recommendation,
            upsell,
            simulateFailure
          })
        }
      );

      const data = await response.json();

      setTransactionId(data.transactionId || "");
      setPaymentAmount(data.amount || 0);

      if (data.success) {
        setPaymentStatus("success");
      } else {
        setPaymentStatus("failed");
      }

      await fetchAuditLogs();

    } catch (error) {
      console.error(error);
      setPaymentStatus("connection-error");
    }

    setPaymentLoading(false);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setPaymentStatus(null);
    setTransactionId("");
    setPaymentAmount(0);
  };

  const total =
    recommendation?.price +
    (upsell ? upsell.price : 0);

  return (
    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>
          <h1>RazorSell AI</h1>
          <p>Agentic Commerce Sales Assistant</p>
        </div>

        <div className="status">
          <span></span>
          Agent Online
        </div>

      </header>


      <main className="container">

        {/* CHAT */}

        <section className="chat-section">

          <div className="section-title">
            <h2>AI Sales Agent</h2>

            <p>
              Find products, discover offers and complete purchases.
            </p>
          </div>


          <div className="chat-box">

            {chat.map((item, index) => (

              <div
                key={index}
                className={`message ${
                  item.type === "user"
                    ? "user-message"
                    : "agent-message"
                }`}
              >

                <div className="message-label">
                  {item.type === "user"
                    ? "You"
                    : "RazorSell AI"}
                </div>

                <div className="message-text">
                  {item.text}
                </div>

              </div>

            ))}


            {loading && (

              <div className="message agent-message">

                <div className="message-label">
                  RazorSell AI
                </div>

                <div className="message-text">
                  Finding the best option...
                </div>

              </div>

            )}

          </div>


          <div className="input-area">

            <input
              type="text"
              placeholder="Example: I need a keyboard under ₹2000"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button onClick={sendMessage}>
              Send
            </button>

          </div>

        </section>


        {/* RECOMMENDATION */}

        <aside className="recommendation-section">

          <h2>Recommendation</h2>


          {!recommendation && (

            <div className="empty-card">

              <div className="empty-icon">
                ✦
              </div>

              <p>
                Your AI recommendation will appear here.
              </p>

            </div>

          )}


          {recommendation && (

            <div className="product-card">

              <div className="product-icon">
                🛍️
              </div>

              <h3>
                {recommendation.name}
              </h3>

              <div className="price">
                ₹{recommendation.price}
              </div>

              <p>
                {recommendation.description}
              </p>

              <div className="reason">
                ✓ {recommendation.reason || "Recommended based on your request"}
              </div>


              {upsell && (

                <div className="upsell">

                  <div className="upsell-label">
                    AI CROSS-SELL
                  </div>

                  <strong>
                    {upsell.name}
                  </strong>

                  <span>
                    ₹{upsell.price}
                  </span>

                  <p>
                    {recommendation.upsellReason ||
                      "Complete your setup with this product."}
                  </p>

                </div>

              )}


              <button
                className="buy-button"
                onClick={() => setShowCheckout(true)}
              >
                Continue to Checkout
              </button>

            </div>

          )}

        </aside>


        {/* CHECKOUT */}

        {showCheckout && recommendation && (

          <div className="checkout-overlay">

            <div className="checkout-modal">

              {!paymentStatus && (

                <>

                  <button
                    className="close-button"
                    onClick={closeCheckout}
                  >
                    ×
                  </button>


                  <div className="checkout-header">

                    <div className="checkout-icon">
                      🔐
                    </div>

                    <h2>
                      Confirm Your Purchase
                    </h2>

                    <p>
                      Review the transaction before payment.
                    </p>

                  </div>


                  <div className="order-details">

                    <div className="order-row">

                      <span>
                        {recommendation.name}
                      </span>

                      <strong>
                        ₹{recommendation.price}
                      </strong>

                    </div>


                    {upsell && (

                      <div className="order-row">

                        <span>
                          {upsell.name}
                        </span>

                        <strong>
                          ₹{upsell.price}
                        </strong>

                      </div>

                    )}


                    <div className="divider"></div>


                    <div className="order-row total">

                      <span>
                        Total
                      </span>

                      <strong>
                        ₹{total}
                      </strong>

                    </div>

                  </div>


                  <div className="security-message">

                    <strong>
                      🛡️ Payment protected by confirmation
                    </strong>

                    <p>
                      RazorSell AI cannot charge you automatically. This demo uses a payment simulator; explicit customer confirmation is required before a payment attempt.
                      Your explicit confirmation is required before
                      a payment is created.
                    </p>

                  </div>


                  <button
                    className="confirm-button"
                    disabled={paymentLoading}
                    onClick={() => createPayment(false)}
                  >

                    {paymentLoading
                      ? "Processing..."
                      : "Confirm Payment"}

                  </button>


                  <button
                    className="demo-failure-button"
                    disabled={paymentLoading}
                    onClick={() => createPayment(true)}
                  >
                    Simulate Payment Failure
                  </button>


                  <button
                    className="cancel-button"
                    onClick={closeCheckout}
                  >
                    Cancel
                  </button>

                </>

              )}


              {/* SUCCESS */}

              {paymentStatus === "success" && (

                <div className="payment-result success-result">

                  <div className="result-icon">
                    ✓
                  </div>

                  <h2>
                    Payment Successful
                  </h2>

                  <p>
                    Your demo transaction has been completed successfully.
                  </p>


                  <div className="transaction-card">

                    <div>
                      <span>
                        Transaction ID
                      </span>

                      <strong>
                        {transactionId}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Amount
                      </span>

                      <strong>
                        ₹{paymentAmount}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        SUCCESS
                      </strong>
                    </div>

                  </div>


                  <div className="audit-note">
                    ✓ Transaction recorded in audit log
                  </div>


                  <button
                    className="confirm-button"
                    onClick={closeCheckout}
                  >
                    Done
                  </button>

                </div>

              )}


              {/* FAILURE */}

              {paymentStatus === "failed" && (

                <div className="payment-result failed-result">

                  <div className="result-icon">
                    !
                  </div>

                  <h2>
                    Payment Failed
                  </h2>

                  <p>
                    The payment was safely rejected.
                    No order was completed.
                  </p>


                  <div className="transaction-card">

                    <div>
                      <span>
                        Transaction ID
                      </span>

                      <strong>
                        {transactionId}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Amount
                      </span>

                      <strong>
                        ₹{paymentAmount}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        FAILED
                      </strong>
                    </div>

                  </div>


                  <div className="failure-note">
                    ⚠️ No order was completed. The customer can safely retry.
                  </div>


                  <button
                    className="confirm-button"
                    disabled={paymentLoading}
                    onClick={() => createPayment(false)}
                  >

                    {paymentLoading
                      ? "Retrying..."
                      : "Retry Payment"}

                  </button>


                  <button
                    className="cancel-button"
                    onClick={closeCheckout}
                  >
                    Cancel
                  </button>

                </div>

              )}


              {/* CONNECTION ERROR */}

              {paymentStatus === "connection-error" && (

                <div className="payment-result failed-result">

                  <div className="result-icon">
                    !
                  </div>

                  <h2>
                    Payment Service Unavailable
                  </h2>

                  <p>
                    We couldn't connect to the payment service.
                  </p>


                  <button
                    className="confirm-button"
                    onClick={() => createPayment(false)}
                  >
                    Retry
                  </button>


                  <button
                    className="cancel-button"
                    onClick={closeCheckout}
                  >
                    Cancel
                  </button>

                </div>

              )}

            </div>

          </div>

        )}

      </main>

      {/* AUDIT TRAIL */}

<section className="audit-section">

  <div className="audit-header">

    <div>
      <h2>Transaction Audit Trail</h2>

      <p>
        Every recommendation and payment action is recorded.
      </p>
    </div>

    <button
      className="audit-refresh"
      onClick={fetchAuditLogs}
    >
      Refresh
    </button>

  </div>


  {auditLogs.length === 0 ? (

    <div className="audit-empty">
      No transactions recorded yet.
    </div>

  ) : (

    <div className="audit-list">

      {[...auditLogs].reverse().map((log) => (

        <div
          className="audit-item"
          key={log.id}
        >

          <div className="audit-item-top">

            <strong>
              {log.type.replaceAll("_", " ")}
            </strong>

            <span>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>

          </div>


          <div className="audit-details">

            {log.product && (
              <span>
                Product: {log.product}
              </span>
            )}

            {log.upsell && (
              <span>
                Cross-sell: {log.upsell}
              </span>
            )}

            {log.amount && (
              <span>
                Amount: ₹{log.amount}
              </span>
            )}

            {log.transactionId && (
              <span>
                Transaction: {log.transactionId}
              </span>
            )}

            {log.reason && (
              <span>
                Reason: {log.reason}
              </span>
            )}

          </div>

        </div>

      ))}

    </div>

  )}

</section>


      <footer>

        <span>RazorSell AI</span>

        <span>•</span>

        <span>Demo Test Mode</span>

        <span>•</span>

        <span>
          Every transaction requires confirmation
        </span>

      </footer>

    </div>
  );
}

export default App;