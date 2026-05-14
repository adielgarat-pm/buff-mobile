/**
 * Founding100 — Public landing page for the Founding 100 lifetime offer.
 *
 * Route: /founding-100 (public, no auth required)
 *
 * What it does:
 *   1. Pulls live `get_founding_count()` from Supabase (public RPC, no auth)
 *   2. Computes current tier ($99 for spots 1-50, $149 for spots 51-100)
 *   3. Renders the offer with a live counter + progress bar
 *   4. CTA opens the BUFF mobile app via deep link `buff://founding-100`
 *      (web purchases route through the mobile app's RC purchase flow)
 *   5. Fallback CTA for desktop visitors: email Adi directly
 *   6. When count >= 100, renders "Founding 100 Closed" empty state
 *
 * Brand palette:
 *   #1a1636 — deep violet canvas
 *   #8b5cf6 — primary violet (buttons, accents)
 *   #A8E63E — lime green (signal color, badges, CTA)
 *   #A78BFA — soft violet (secondary text)
 *
 * Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Phases / Phase 4
 *
 * To deploy on Lovable (buff-main):
 *   1. Open the Lovable project for buffadhd.com
 *   2. Create new file: src/pages/Founding100.tsx — paste this content
 *   3. Update src/App.tsx — add the route (see web-landing/README.md)
 *   4. Update i18n files — add keys from web-landing/i18n-additions.json
 *   5. Lovable auto-deploys on save
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles, Check, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import buffLogo from '@/assets/buff-logo-no-bg.png';

const TIER_99_LIMIT = 50;
const HARD_CAP = 100;
const APP_DEEP_LINK = 'buff://founding-100';
// Updated 2026-05-14: domain email adi@buffadhd.com does not exist yet
// (deferred Google Workspace setup). Use Adi's working branded Gmail until then.
// Switch back to adi@buffadhd.com once Workspace is live.
const FOUNDER_EMAIL = 'buff.parenting@gmail.com';

export default function Founding100() {
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [salesCount, setSalesCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);

  // ── Fetch the live counter ────────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_founding_count');
      if (error) {
        console.warn('[Founding100] count fetch error:', error);
        setSalesCount(0);
      } else {
        setSalesCount(data ?? 0);
      }
    } catch (err) {
      console.warn('[Founding100] count fetch exception:', err);
      setSalesCount(0);
    } finally {
      setCountLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    // Refresh every 30 seconds while page is open
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // ── SEO meta ──────────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = language === 'he'
      ? 'BUFF — Founding 100 | 100 הראשונים בלבד'
      : 'BUFF — Founding 100 | Lifetime Access for the First 100';

    const metaDesc = document.querySelector('meta[name="description"]');
    const content = language === 'he'
      ? 'הצטרפו ל-100 הראשונים. גישה לכל החיים ל-BUFF Family Plan. תשלום אחד, לתמיד. החל מ-$99.'
      : 'Join the first 100. Lifetime access to BUFF Family Plan. One payment, forever. Starting at $99.';
    if (metaDesc) metaDesc.setAttribute('content', content);
  }, [language]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const count = salesCount ?? 0;
  const isCapReached = count >= HARD_CAP;
  const currentTier: 99 | 149 = count < TIER_99_LIMIT ? 99 : 149;
  const spotsLeftAtCurrentTier = currentTier === 99
    ? TIER_99_LIMIT - count
    : HARD_CAP - count;
  const totalSpotsLeft = HARD_CAP - count;
  const progressPct = Math.min((count / HARD_CAP) * 100, 100);

  // ── Open mobile app via deep link ─────────────────────────────────────────
  const handleClaimSpot = () => {
    // Try the deep link — works if mobile app is installed
    window.location.href = APP_DEEP_LINK;
    // Note: on desktop, this will silently fail. Users can email instead.
  };

  // ── Render: cap reached ───────────────────────────────────────────────────
  if (!countLoading && isCapReached) {
    return (
      <div
        className="min-h-[100dvh] bg-[#1a1636] text-white"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Nav language={language} setLanguage={setLanguage} t={t} isRTL={isRTL} />
        <main className="max-w-2xl mx-auto px-5 sm:px-6 py-20 text-center">
          <Sparkles className="w-14 h-14 text-[#A8E63E] mx-auto mb-6" />
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {language === 'he'
              ? 'ה-Founding 100 נסגרו.'
              : 'The Founding 100 has closed.'}
          </h1>
          <p className="text-[#A78BFA] text-lg mb-8 leading-relaxed">
            {language === 'he'
              ? 'כל 100 המקומות נתפסו. תודה שאתם פה — תוכלו להתחיל לחינם ולשדרג ל-Family Plan ($9 לחודש) בכל זמן.'
              : 'All 100 founding spots are claimed. Thank you — start free, upgrade to Family Plan ($9/mo) when ready.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#8b5cf6] hover:bg-[#7C3AED] text-white font-semibold px-8 py-4 rounded-full transition-colors"
          >
            {language === 'he' ? 'חזרה לדף הבית' : 'Back to BUFF'}
            <ArrowLeft className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
          </Link>
        </main>
      </div>
    );
  }

  // ── Render: loading ───────────────────────────────────────────────────────
  if (countLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#1a1636] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#A8E63E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render: main offer ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-[100dvh] bg-[#1a1636] text-white"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Nav language={language} setLanguage={setLanguage} t={t} isRTL={isRTL} />

      <main className="max-w-3xl mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-16">
        {/* Eyebrow */}
        <div className="text-center mb-4">
          <span className="inline-block text-[#A8E63E] text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
            {language === 'he' ? 'FOUNDING 100' : 'FOUNDING 100'}
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-display text-center text-3xl sm:text-5xl font-bold leading-tight mb-4">
          {language === 'he'
            ? 'היו מ-100 הראשונים.'
            : 'Be one of the first 100.'}
        </h1>

        {/* Sub */}
        <p className="text-center text-[#A78BFA] text-base sm:text-xl mb-10 leading-relaxed max-w-xl mx-auto">
          {language === 'he'
            ? 'גישה לכל החיים ל-BUFF Family Plan. תשלום אחד. לתמיד.'
            : 'Lifetime BUFF Family Plan. One payment. Forever.'}
        </p>

        {/* Live counter */}
        <div className="bg-[#2D2546] border border-[#A8E63E]/30 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="text-center">
            <div className="text-[#A8E63E] text-5xl sm:text-7xl font-bold leading-none">
              {count}
            </div>
            <div className="text-[#A78BFA] text-sm mt-2 mb-4">
              {language === 'he' ? 'מתוך 100 נתפסו' : 'of 100 claimed'}
            </div>
            <div className="w-full h-2 bg-[#1a1636] rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-[#A8E63E] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-white font-medium text-sm sm:text-base">
              {language === 'he'
                ? `נשארו ${spotsLeftAtCurrentTier} מקומות ב-$${currentTier}`
                : `${spotsLeftAtCurrentTier} spots left at $${currentTier}`}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-[#2D2546] border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
          {[
            { he: 'Family Plan מלא — 3 ילדים, משימות ללא הגבלה', en: 'Family Plan equivalent — 3 kids, unlimited tasks' },
            { he: 'תג Founding Member בפרופיל שלכם', en: 'Founding Member badge in your profile' },
            { he: 'ערוץ priority email ישיר לעדי', en: 'Priority email channel direct to Adi' },
            { he: 'כל הפיצ׳רים העתידיים — בחינם', en: 'All future features included free' },
            { he: 'נעילת מחיר קבועה — לא יעלה לעולם', en: 'Permanent price lock — no future increases' },
            { he: 'אחריות שביעות רצון 30 ימים', en: '30-day satisfaction guarantee' },
          ].map((feat, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <Check className="w-5 h-5 text-[#A8E63E] shrink-0 mt-0.5" />
              <span className="text-white text-sm sm:text-base">
                {language === 'he' ? feat.he : feat.en}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleClaimSpot}
          className="w-full bg-[#A8E63E] hover:bg-[#9BD534] text-[#1a1636] font-bold rounded-2xl py-6 mb-4 transition-colors group"
        >
          <div className="text-3xl sm:text-4xl font-extrabold">
            ${currentTier}
          </div>
          <div className="text-sm sm:text-base font-semibold mt-1 flex items-center justify-center gap-1.5">
            {language === 'he'
              ? `אתפוס את מקום #${count + 1} — גישה לכל החיים`
              : `Claim spot #${count + 1} — lifetime access`}
            <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
          </div>
        </button>

        {/* Tier explainer */}
        <p className="text-center text-[#A78BFA] text-xs sm:text-sm mb-2">
          {language === 'he'
            ? `מקומות 1–50: $99 · מקומות 51–100: $149`
            : `Spots 1–50: $99 · Spots 51–100: $149`}
          {currentTier === 99 && (
            <>
              {' · '}
              {language === 'he'
                ? `אחרי מקום 50, המחיר יעלה ל-$149`
                : `After spot #50, price rises to $149`}
            </>
          )}
        </p>

        {/* Open-in-app note + email fallback */}
        <p className="text-center text-[#7C3AED] text-xs sm:text-sm mb-10 leading-relaxed">
          {language === 'he' ? (
            <>
              הלחיצה תפתח את אפליקציית BUFF להשלמת התשלום. אין לכם את האפליקציה עוד?
              {' '}
              <a href={`mailto:${FOUNDER_EMAIL}?subject=Founding 100 — interested`} className="underline hover:text-[#A8E63E]">
                שלחו לעדי מייל
              </a>
              {' '}
              ונסדר את זה ביחד.
            </>
          ) : (
            <>
              Tapping the button opens the BUFF app to complete purchase. Don't have it yet?
              {' '}
              <a href={`mailto:${FOUNDER_EMAIL}?subject=Founding 100 — interested`} className="underline hover:text-[#A8E63E]">
                Email Adi
              </a>
              {' '}
              and we'll set it up together.
            </>
          )}
        </p>

        {/* Founder note */}
        <div className="bg-[#2D2546]/50 border-l-4 border-[#A8E63E] rounded-r-xl p-5 sm:p-6 mb-8">
          <p className="text-[#A78BFA] text-xs uppercase font-bold tracking-wider mb-2">
            {language === 'he' ? 'מילה מהמייסדת' : 'A note from the founder'}
          </p>
          <p className="text-white text-sm sm:text-base leading-relaxed">
            {language === 'he' ? (
              <>
                בניתי את BUFF כי לא מצאתי אפליקציית ADHD אחת שמלווה גם את הילדים הקטנים וגם את הנוער.
                ה-100 הראשונים מקבלים גישה לכל החיים — לא כי הם משלמים יותר, אלא כי הם פה מההתחלה.
                תודה.
                <br/><br/>
                — עדי, מייסדת BUFF
              </>
            ) : (
              <>
                I built BUFF because I couldn't find a single ADHD app that followed kids
                through both early childhood and teenage years. The first 100 get lifetime
                access — not because they pay more, but because they're here from the start.
                Thank you.
                <br/><br/>
                — Adi, founder of BUFF
              </>
            )}
          </p>
        </div>

        {/* Fine print */}
        <p className="text-center text-[#7C3AED]/70 text-[11px] sm:text-xs leading-relaxed px-2">
          {language === 'he'
            ? 'תשלום חד-פעמי. גישה לכל החיים, ללא חידוש. ביטול בתוך 30 ימים — החזר מלא.'
            : 'One-time payment. Lifetime access, no renewals. Cancel within 30 days for a full refund.'}
        </p>
      </main>

      <Footer language={language} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents

function Nav({ language, setLanguage, t, isRTL }: {
  language: string;
  setLanguage: (l: 'en' | 'he') => void;
  t: (k: string) => string;
  isRTL: boolean;
}) {
  return (
    <nav className="sticky top-0 z-50 bg-[#1a1636]/90 backdrop-blur border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={buffLogo} alt="BUFF" className="h-8 w-8 object-contain" />
            <span className="text-white font-bold text-lg">BUFF</span>
          </Link>
          <button
            onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
            className="text-[#A78BFA] hover:text-white text-sm font-medium px-3 py-1.5 rounded-full border border-white/10 hover:border-[#A78BFA] transition-colors"
          >
            {language === 'he' ? 'EN' : 'עב'}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Footer({ language }: { language: string }) {
  return (
    <footer className="border-t border-white/5 py-8 px-5">
      <div className="max-w-5xl mx-auto text-center space-y-3">
        <p className="text-[#A78BFA] text-xs italic">
          {language === 'he' ? 'נוסד על ידי אמא עם משימה' : 'Founded by a mom with a mission'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs text-[#7C3AED]">
          <Link to="/about" className="hover:text-[#A8E63E] flex items-center gap-1 transition-colors">
            <Heart className="w-3 h-3" />
            {language === 'he' ? 'אודות' : 'About'}
          </Link>
          <Link to="/privacy" className="hover:text-[#A8E63E] transition-colors">
            {language === 'he' ? 'פרטיות' : 'Privacy'}
          </Link>
          <Link to="/terms" className="hover:text-[#A8E63E] transition-colors">
            {language === 'he' ? 'תנאי שימוש' : 'Terms'}
          </Link>
          <a
            href={language === 'he' ? 'https://chat.whatsapp.com/JUCsJ7yrNWQC4E25vqNIK5' : 'https://chat.whatsapp.com/KM1b9UmQO0cBGgCVI54W7R'}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#A8E63E] flex items-center gap-1 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            {language === 'he' ? 'קהילה' : 'Community'}
          </a>
        </div>
        <p className="text-[#7C3AED]/50 text-[10px]">
          © {new Date().getFullYear()} BUFF. {language === 'he' ? 'כל הזכויות שמורות' : 'All rights reserved'}.
        </p>
      </div>
    </footer>
  );
}
