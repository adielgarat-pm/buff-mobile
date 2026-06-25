import { ChevronRight, Mountain, BarChart3, Handshake, Heart, MessageCircle, Brain } from 'lucide-react';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { Button } from '@/components/ui/button';
import buffLogo from '@/assets/buff-logo.png';
import buffLogoNoBg from '@/assets/buff-logo-no-bg.png';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

// Where "Start Free" / "Get Started" send people. The BUFF web app (Workstream 2) will live here;
// until it ships, update this single constant to wherever sign-up should go.
const APP_URL = 'https://app.buffadhd.com';

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
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
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

// Benefit card component
function BenefitCard({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow duration-300">
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

  const goToApp = () => {
    window.location.href = APP_URL;
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

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Sticky Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
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
              <Button variant="ghost" className="rounded-full hidden sm:inline-flex" onClick={goToApp}>
                {t('nav.login')}
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
                onClick={goToApp}
              >
                {t('nav.getStarted')}
                <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRTL ? 'mr-0.5 rotate-180' : 'ml-0.5'}`} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-24 sm:pt-28 pb-14 sm:pb-20 px-5 sm:px-4 relative overflow-hidden">
        {/* Subtle wave background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Logo mark */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <img
              src={buffLogoNoBg}
              alt="BUFF - ADHD routine app for kids and teens"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
              loading="eager"
            />
          </div>

          {/* Primary headline — scaled down on mobile */}
          <h1 className="font-display text-[1.6rem] leading-[1.25] sm:text-4xl md:text-5xl font-bold sm:leading-tight mb-4 sm:mb-5 px-1">
            <span className="text-foreground">{t('landing.heroHeadline')}</span>
            <br />
            <span className="text-primary">{t('landing.heroHeadline2')}</span>
          </h1>

          {/* Sub-headline — balanced wrapping */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed [text-wrap:balance]">
            {t('landing.heroSub')}
          </p>

          {/* SEO-rich subtitle */}
          <p className="text-xs sm:text-sm text-muted-foreground/50 max-w-sm sm:max-w-md mx-auto mb-8 sm:mb-8 -mt-2 sm:-mt-4 [text-wrap:balance]">
            An ADHD routine app for kids &amp; teens — built on executive function research.
          </p>

          {/* CTA — full width on mobile */}
          <Button
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg w-full sm:w-auto px-10 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={goToApp}
          >
            {t('landing.startFree')}
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section id="features" className="py-14 sm:py-20 px-5 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-4">
              {t('landing.benefitsTitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            <BenefitCard
              icon={Mountain}
              title={t('landing.benefit1Title')}
              description={t('landing.benefit1Desc')}
            />
            <BenefitCard
              icon={BarChart3}
              title={t('landing.benefit2Title')}
              description={t('landing.benefit2Desc')}
            />
            <BenefitCard
              icon={Handshake}
              title={t('landing.benefit3Title')}
              description={t('landing.benefit3Desc')}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials Section (static snapshot) ── */}
      <TestimonialsSection />

      {/* ── CTA Section ── */}
      <section className="py-14 sm:py-20 px-5 sm:px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-4">
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground mb-8 sm:mb-10 leading-relaxed max-w-lg mx-auto [text-wrap:balance]">
            {t('landing.ctaSubtitle')}
          </p>
          <Button
            size="lg"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-base sm:text-lg w-full sm:w-auto px-10 py-6 shadow-lg hover:shadow-xl transition-all"
            onClick={goToApp}
          >
            {t('landing.ctaButton')}
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-5 border-t border-border bg-card/30">
        <div className="max-w-5xl mx-auto">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <BuffLogo />
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
            <a href="https://www.youtube.com/@buff.adhdapp" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              YouTube
            </a>
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
