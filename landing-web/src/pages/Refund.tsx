import { useNavigate } from 'react-router-dom';

export default function Refund() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: June 21, 2026</p>
        <hr className="mb-8 border-border" />

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. How payments are processed</h2>
            <p>Our payments and order fulfilment are handled by <strong>Paddle.com</strong>, who acts as the Merchant of Record (reseller) for BUFF. When you subscribe, Paddle processes the payment, issues the invoice, and handles applicable taxes. Paddle's <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Buyer Terms</a> also apply to your purchase.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. 14-day money-back guarantee</h2>
            <p>If BUFF Premium isn't right for your family, you can request a full refund within <strong>14 days</strong> of your purchase, no questions asked. This applies to your first payment on a new subscription or a lifetime plan.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Subscriptions &amp; renewals</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Monthly and annual plans renew automatically at the end of each period until you cancel.</li>
              <li>You can cancel at any time — see section 4. Cancelling stops future renewals; you keep Premium access until the end of the period you already paid for.</li>
              <li>Renewal payments (after the 14-day window) are generally non-refundable, except where required by law or at our discretion for genuine billing errors.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. How to cancel</h2>
            <p>You can cancel your subscription at any time by either:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Using the cancellation link in the receipt email Paddle sent you, or</li>
              <li>Emailing us at <a href="mailto:buff.parenting@gmail.com" className="text-primary hover:underline">buff.parenting@gmail.com</a> and we'll cancel it for you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. How to request a refund</h2>
            <p>Email <a href="mailto:buff.parenting@gmail.com" className="text-primary hover:underline">buff.parenting@gmail.com</a> with the email address used for the purchase. We aim to respond within 2 business days. Approved refunds are returned by Paddle to your original payment method, typically within 5–10 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Lifetime (Founding) plans</h2>
            <p>One-time lifetime plans are covered by the same 14-day money-back guarantee. After 14 days, lifetime purchases are non-refundable.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p>Questions about billing, cancellation, or refunds? Reach us at <a href="mailto:buff.parenting@gmail.com" className="text-primary hover:underline">buff.parenting@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
