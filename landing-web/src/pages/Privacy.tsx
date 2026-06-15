import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: February 19, 2026</p>
        <Separator className="mb-8" />

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Who We Are</h2>
            <p>BUFF is a family-focused routine management app designed to support children with ADHD and executive function challenges. We take your family's privacy seriously.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. What We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account info:</strong> Email address and display name when you sign up.</li>
              <li><strong>Child profiles:</strong> First name, age, and avatar — never last names or photos.</li>
              <li><strong>Task & routine data:</strong> Tasks you create, completion history, and schedule preferences.</li>
              <li><strong>Usage data:</strong> Anonymous analytics to improve the app experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. How We Use AI</h2>
            <p>BUFF uses AI to generate personalized insights and routine suggestions for parents. AI processes routine completion patterns — it never accesses personal identifiers or communicates directly with children.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data Safety</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All data is encrypted in transit and at rest.</li>
              <li>We never sell, share, or monetize your family's data.</li>
              <li>Child data is isolated per family and protected by row-level security.</li>
              <li>We do not use tracking pixels or third-party ad networks.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your Rights</h2>
            <p>You can request deletion of your account and all associated data at any time by contacting us. We will remove all personal data within 30 days of your request.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Children's Privacy</h2>
            <p>BUFF is designed for use by parents. Children may use the app under parental supervision. We comply with applicable children's privacy regulations and do not knowingly collect data from children under 13 without parental consent.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Contact</h2>
            <p>Questions about your privacy? Reach out to us at <a href="mailto:buff.parenting@gmail.com" className="text-primary hover:underline">buff.parenting@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
