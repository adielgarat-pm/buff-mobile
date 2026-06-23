import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    highlight: false,
    features: [
      'One child',
      'Daily routines & tasks',
      'BUDDY companion + skins',
      'Vibe Check & Pause Mode',
      'Rewards shop',
    ],
  },
  {
    name: 'BUFF Premium',
    price: '$9.99',
    cadence: 'per month — or $59.99 / year',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited children',
      'Unlimited tasks per child',
      'Parent Insights',
      'Timetable import & Backpack prep',
      'Activities & seasonal lists',
    ],
  },
  {
    name: 'Founding Member',
    price: '$99–$149',
    cadence: 'one-time · lifetime (launch only, 100 spots)',
    highlight: false,
    features: [
      'All Premium features, forever',
      'No subscription, ever',
      'Founding member badge',
      'Family-wide access',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Pricing</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Simple plans for families. Cancel anytime. Payments are securely handled by Paddle.
        </p>
        <hr className="mb-8 border-border" />

        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
              <div className="mt-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{plan.cadence}</p>

              <ul className="mt-5 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          Prices are in USD and may vary by region and applicable tax. See our{' '}
          <a href="/refund" className="text-primary hover:underline">Refund &amp; Cancellation Policy</a>{' '}
          and <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}
