import { ChevronRight, Mountain, BarChart3, Handshake, Heart, MessageCircle, Brain, Check, Star, Sparkles, Gift, Sprout } from 'lucide-react';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { Button } from '@/components/ui/button';
import buffLogo from '@/assets/buff-logo.png';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';
import screenChildBuddy from '@/assets/screens/02-child-dashboard-buddy.png';
import screenParentDashboard from '@/assets/screens/01-parent-dashboard.png';
import screenParentTasks from '@/assets/screens/05-parent-tasks.png';
import screenManageChildren from '@/assets/screens/06-manage-children.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

// Where "Start Free" / "Get Started" send people: the live BUFF web app (Expo web PWA),
// deployed at www.buffadhd.com (Vercel project "buff-mobile"). This landing takes the apex
// buffadhd.com, so APP_URL must NOT point at the apex — that would loop back to this page.
const APP_URL = 'https://www.buffadhd.com';

// Brand palette (BUFF_BRAND.md). Kept inline as Tailwind arbitrary values, consistent with the
// existing logo chip (bg-[#DCFCE7]). Primary/accent buttons keep the design-token classes.
const VIOLET_DEEP = '#2A2150';   // dark canvas (trust bar, final CTA)
const LIME_BOLT = '#A8E63E';     // dopamine accent (logo bolt, dark-section button)

// JSON-LD Structured Data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BUFF - ADHD Routine App for Kids & Teens",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android (PWA)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "BUFF helps kids and teens with ADHD master daily routines using research-backed executive function strategies. Turn overwhelming tasks into achievable victories with coaching-inspired motivation.",
  "url": "https://buffadhd.com",
  "author": {
    "@type": "Person",
    "name": "Adi Elgart German"
  },
  "keywords": "ADHD, ADHD kids, ADHD teens, ADHD routine app, executive function app, ADHD children, ADHD task manager, ADHD daily routine, ADHD parenting tool, executive functioning skills"
};

function BuffLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center">
        <img src={buffLogo} alt="BUFF Logo" className="h-8 w-8 object-contain" />
      </div>
    </div>
  );
}

// Phone mockup frame — drops a real app screenshot into a soft dark device shell.
// cropTop pulls the image up (as a % of width) to hide a top band — used on the
// child screenshot, which carries a "Viewing as parent" preview banner from capture.
function PhoneFrame({ src, alt, className = '', cropTop = 0 }: { src: string; alt: string; className?: string; cropTop?: number }) {
  return (
    <div className={`rounded-[2rem] bg-[#1F1A3C] p-1.5 shadow-2xl shadow-primary/25 ${className}`}>
      <div className="rounded-[1.6rem] overflow-hidden bg-white" style={{ aspectRatio: '1080 / 2160' }}>
        <img src={src} alt={alt} className="w-full" style={{ marginTop: `-${cropTop}%` }} loading="lazy" />
      </div>
    </div>
  );
}

// Benefit card component
function BenefitCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 sm:p-7 border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-display text-lg font-bold text-foreground mb-3 tracking-wide">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}

export default function Landing() {
  const { language, setLanguage, t, isRTL } = useLanguage();

  // Deep-link straight into the app, skipping the app's own (retired) landing screen.
  // Get Started / Start Free → role chooser; Login → login form (no role choice).
  const goToSignup = () => {
    window.location.href = `${APP_URL}/RoleSelection`;
  };
  const goToLogin = () => {
    window.location.href = `${APP_URL}/Login`;
  };

  // Inject JSON-LD and update meta tags for SEO
  useEffect(() => {
    const existingScript = document.querySelector('script[data-schema="buff-app"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema', 'buff-app');
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    document.title = 'BUFF — ADHD Routine App for Kids & Teens | Executive Function Coaching';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'BUFF helps kids and teens with ADHD master daily routines using research-backed executive function strategies. Free coaching-inspired app for the whole family.');
    }

    return () => {
      const script = document.querySelector('script[data-schema="buff-app"]');
      if (script) script.remove();
    };
  }, []);

  // Three product pillars — honest value statements (not fabricated metrics).
  const pillarPoints = [
    { icon: Gift, text: t('landing.pillar1') },
    { icon: Heart, text: t('landing.pillar2') },
    { icon: Sprout, text: t('landing.pillar3') },
  ];

  const howSteps = [
    { title: t('landing.howStep1Title'), desc: t('landing.howStep1Desc') },
    { title: t('landing.howStep2Title'), desc: t('landing.howStep2Desc') },
    { title: t('landing.howStep3Title'), desc: t('landing.howStep3Desc') },
  ];

  const showcase = [
    { src: screenParentDashboard, cap: t('landing.showcaseCap1') },
    { src: screenParentTasks, cap: t('landing.showcaseCap2') },
    { src: screenManageChildren, cap: t('landing.showcaseCap3') },
  ];

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Sticky Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <BuffLogo />

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Toggle - compact on mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                className="rounded-full px-3 sm:px-4 text-xs sm:text-sm font-medium h-8 sm:h-9"
              >
                {t('landing.langToggle')}
              </Button>

              {/* Login - hidden on mobile to reduce clutter */}
              <Button variant="ghost" className="rounded-full hidden sm:inline-flex" onClick={goToLogin}>
                {t('nav.login')}
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                onClick={goToSignup}
              >
                {t('nav.getStarted')}
                <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRTL ? 'mr-0.5 rotate-180' : 'ml-0.5'}`} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-24 sm:pt-28 pb-12 sm:pb-16 px-5 sm:px-6 relative overflow-hidden bg-[#F7F3FD]">
        {/* Soft brand glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Copy column */}
            <div className="text-center lg:text-start">
              {/* Research badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-[#2E7D5B] px-3.5 py-1.5 text-xs sm:text-sm font-medium mb-5">
                <Sparkles className="w-3.5 h-3.5" />
                {t('landing.heroBadge')}
              </div>

              {/* Logo mark (mobile keeps it visible above headline) */}
              <div className="flex justify-center lg:hidden mb-5">
                <img
                  src={buffLogoNoBg}
                  alt="BUFF - ADHD routine app for kids and teens"
                  className="h-12 w-12 object-contain"
                  loading="eager"
                />
              </div>

              {/* Primary headline */}
              <h1 className="font-display text-[1.85rem] leading-[1.2] sm:text-4xl md:text-5xl font-bold sm:leading-tight mb-4 sm:mb-5">
                <span className="text-foreground">{t('landing.heroHeadline')}</span>
                <br />
                <span className="text-primary">{t('landing.heroHeadline2')}</span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-xl text-muted-foreground max-w-md mx-auto lg:mx-0 mb-7 sm:mb-8 leading-relaxed [text-wrap:balance]">
                {t('landing.heroSub')}
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg w-full sm:w-auto px-10 py-6 shadow-lg hover:shadow-xl transition-all"
                  onClick={goToSignup}
                >
                  {t('landing.startFree')}
                  <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
                {/* Social proof */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </span>
                  <span>{t('landing.heroSocialProof')}</span>
                </div>
              </div>
              {/* Risk reducer */}
              <p className="text-xs text-muted-foreground/70 mt-3.5">{t('landing.ctaReassure')}</p>
            </div>

            {/* Phone column */}
            <div className="relative flex justify-center lg:justify-end">
              <PhoneFrame
                src={screenChildBuddy}
                alt="BUFF child dashboard with BUDDY companion"
                className="w-[230px] sm:w-[270px]"
                cropTop={20}
              />
              {/* Floating proof chip */}
              <div className="absolute -bottom-3 left-2 sm:left-6 bg-card rounded-2xl shadow-xl border border-border px-3.5 py-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-[#2E9C72]" strokeWidth={3} />
                </div>
                <div className="text-start leading-tight">
                  <div className="text-xs font-bold text-foreground">{t('landing.heroChipTitle')}</div>
                  <div className="text-[11px] text-muted-foreground">{t('landing.heroChipSub')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars Bar ── */}
      <section className="px-5 sm:px-6" style={{ backgroundColor: VIOLET_DEEP }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-3 py-6 sm:py-8">
          {pillarPoints.map((p, i) => (
            <div key={i} className="flex items-center justify-center gap-2.5 px-2">
              <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(168,230,62,0.15)' }}>
                <p.icon className="w-4 h-4" style={{ color: LIME_BOLT }} />
              </span>
              <span className="text-sm sm:text-base font-medium text-white [text-wrap:balance]">{p.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section id="features" className="py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide">
              {t('landing.benefitsTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            <BenefitCard icon={Mountain} title={t('landing.benefit1Title')} description={t('landing.benefit1Desc')} />
            <BenefitCard icon={BarChart3} title={t('landing.benefit2Title')} description={t('landing.benefit2Desc')} />
            <BenefitCard icon={Handshake} title={t('landing.benefit3Title')} description={t('landing.benefit3Desc')} />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6 bg-[#F7F3FD]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide">
              {t('landing.howTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {howSteps.map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5 shadow-lg shadow-primary/30">
                  {i + 1}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2 tracking-wide">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase (real screenshots) ── */}
      <section className="py-16 sm:py-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-3">
              {t('landing.showcaseTitle')}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto [text-wrap:balance]">
              {t('landing.showcaseSub')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 max-w-3xl mx-auto">
            {showcase.map((shot, i) => (
              <div key={i} className="flex flex-col items-center">
                <PhoneFrame src={shot.src} alt={shot.cap} className="w-[210px] sm:w-full max-w-[230px]" />
                <p className="mt-4 text-sm font-medium text-foreground text-center">{shot.cap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials Section (static snapshot) ── */}
      <TestimonialsSection />

      {/* ── CTA Section ── */}
      <section className="py-16 sm:py-24 px-5 sm:px-6 relative overflow-hidden" style={{ backgroundColor: VIOLET_DEEP }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(168,230,62,0.12)' }} />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-4 text-white">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-white/70 mb-8 sm:mb-10 leading-relaxed max-w-lg mx-auto [text-wrap:balance]">
            {t('landing.ctaSubtitle')}
          </p>
          <Button
            size="lg"
            className="rounded-full text-base sm:text-lg w-full sm:w-auto px-10 py-6 shadow-lg hover:shadow-xl transition-all font-bold"
            style={{ backgroundColor: LIME_BOLT, color: VIOLET_DEEP }}
            onClick={goToSignup}
          >
            {t('landing.ctaButton')}
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
          <p className="text-xs text-white/50 mt-5">{t('landing.ctaReassure')}</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-5 border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-1.5 mb-8">
            <BuffLogo />
            <p className="font-display text-base font-bold text-foreground mt-1">
              {t('landing.missionTagline')}
            </p>
            <span className="text-sm text-muted-foreground italic">
              {t('landing.foundedBy')}
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground mb-8">
            <Link to="/about" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {language === 'he' ? 'אודות' : 'About'}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {language === 'he' ? 'פרטיות' : 'Privacy'}
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {language === 'he' ? 'תנאי שימוש' : 'Terms'}
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              {language === 'he' ? 'מחירים' : 'Pricing'}
            </Link>
            <Link to="/refund" className="hover:text-foreground transition-colors">
              {language === 'he' ? 'החזרים' : 'Refunds'}
            </Link>
            <a href={language === 'he' ? 'https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5' : 'https://chat.whatsapp.com/KM1b9UmQO0cBGgCVI54W7R'} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {language === 'he' ? 'קהילה' : 'Community'}
            </a>
          </div>

          {/* Bottom */}
          <div className="pt-6 border-t border-border text-center space-y-2">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Brain className="w-4 h-4" />
              {t('landing.researchBacked')}
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} BUFF. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
