import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: February 19, 2026</p>
        <Separator className="mb-8" />

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. About BUFF</h2>
            <p>BUFF is a routine management tool for families raising children with ADHD and executive function challenges. It provides task tracking, habit building, and AI-powered insights to support daily structure.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Not Medical Advice</h2>
            <p>BUFF is not a medical, psychological, or therapeutic tool. The insights and suggestions provided by the app are for informational and organizational purposes only. Always consult qualified healthcare professionals for clinical guidance regarding your child's needs.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Your Account</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to create an account.</li>
              <li>You are responsible for all activity under your account, including child profiles you create.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree to use BUFF only for its intended purpose — managing family routines. You may not attempt to reverse-engineer, exploit, or misuse the app or its AI features.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. AI Features</h2>
            <p>BUFF uses artificial intelligence to analyze routine patterns and generate parenting insights. AI-generated content is advisory only and may not always be accurate. You should use your own judgment when acting on any AI suggestion.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data & Privacy</h2>
            <p>Your use of BUFF is also governed by our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>. We are committed to protecting your family's data and never selling it to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
            <p>BUFF is provided "as is" without warranties of any kind. We are not liable for any decisions made based on the app's suggestions or any interruption in service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of BUFF after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
            <p>Questions? Reach out at <a href="mailto:buff.parenting@gmail.com" className="text-primary hover:underline">buff.parenting@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
