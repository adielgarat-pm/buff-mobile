import { useState } from 'react';
import { Star, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import reviewsData from '@/data/reviews.json';

interface Review {
  id: string;
  display_name: string;
  display_name_en: string | null;
  rating: number;
  review_text: string;
  detected_lang: string;
  translated_text_en: string | null;
  created_at: string;
}

const heMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const enMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Regex to detect tag-only lines like "✅ Tasks completed, 🌙 Easy bedtime"
const TAG_PATTERN = /^[\p{Emoji_Presentation}\p{Emoji}️✅🌙💤🔥🧘‍♀️✍️🚀⭐🎯💪🏆❤️☀️🎉🧠]\s*.+$/u;

function parseReviewContent(text: string) {
  // Split by line breaks or " — " separator
  const parts = text.split(/\n|—/).map(p => p.trim()).filter(Boolean);

  const tags: string[] = [];
  const freeTextParts: string[] = [];

  for (const part of parts) {
    // Check if this part is a comma-separated list of tags
    const segments = part.split(',').map(s => s.trim()).filter(Boolean);
    const allTags = segments.every(s => TAG_PATTERN.test(s));

    if (allTags && segments.length > 0) {
      tags.push(...segments);
    } else {
      freeTextParts.push(part);
    }
  }

  return {
    tags,
    freeText: freeTextParts.join(' ').trim(),
    hasFreeText: freeTextParts.join('').trim().length > 0,
  };
}

function ReviewCard({ review, isRTL }: { review: Review; isRTL: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = isRTL ? heMonths[d.getMonth()] : enMonths[d.getMonth()];
    return `${month} ${d.getFullYear()}`;
  };

  // Determine display text (translated or original)
  const rawText = (() => {
    if (isRTL) return review.review_text;
    if (review.detected_lang === 'he' && review.translated_text_en) {
      return showOriginal ? review.review_text : review.translated_text_en;
    }
    return review.review_text;
  })();

  const isShowingOriginalHebrew = showOriginal && review.detected_lang === 'he';
  const canToggleLang = !isRTL && review.detected_lang === 'he' && review.translated_text_en;
  const isTranslated = canToggleLang && !showOriginal;

  // Parse content into tags and free text
  const { tags, freeText, hasFreeText } = parseReviewContent(rawText);

  // Rule A: has free text → truncate text, tags in footer
  // Rule B: only tags → show tags as main content, no expand
  const isRuleA = hasFreeText;

  return (
    <div className="bg-background rounded-2xl p-5 sm:p-6 border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Header: Stars + Name + Date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-0.5">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground">{formatDate(review.created_at)}</span>
      </div>

      <p className="text-xs font-semibold text-foreground mb-2.5">
        {!isRTL && review.display_name_en ? review.display_name_en : review.display_name}
      </p>

      {/* Body content */}
      {isRuleA ? (
        <>
          {/* Free text with truncation */}
          <div className="relative">
            <p
              className={cn(
                'text-sm text-foreground/90 leading-relaxed',
                !expanded && 'line-clamp-2 sm:line-clamp-3',
                isShowingOriginalHebrew && 'text-right'
              )}
              dir={isShowingOriginalHebrew ? 'rtl' : undefined}
            >
              "{freeText}"
            </p>
          </div>

          {/* Read More / Collapse toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary/80 hover:text-primary transition-colors mt-1.5 mb-2"
          >
            {expanded
              ? (isRTL ? 'הצג פחות' : 'Show less')
              : (isRTL ? 'קראו עוד...' : 'Read more...')}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Tags footer — visible when expanded */}
          {expanded && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-border">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-muted text-muted-foreground rounded-full px-2.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Rule B: Tags only — show as main content, no expand */
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Language toggle */}
      {canToggleLang && (
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-auto pt-2"
        >
          <Languages className="w-3 h-3" />
          {isTranslated ? 'View Original' : 'View Translation'}
        </button>
      )}
    </div>
  );
}

export function TestimonialsSection() {
  // Static snapshot (Lovable-independent). Sourced from docs/BUFF_TESTIMONIALS.md (admin-approved,
  // the same reviews the Lovable Landing displayed). To refresh, edit src/data/reviews.json.
  const reviews = reviewsData as Review[];
  const { language } = useLanguage();
  const isRTL = language === 'he';

  if (reviews.length === 0) return null;

  return (
    <section className="py-14 sm:py-20 px-5 sm:px-4 bg-card/50">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide mb-3 text-center">
          {isRTL ? 'מה הורים אומרים' : 'What Parents Say'}
        </h2>
        <p className="text-muted-foreground text-center mb-10 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
          {isRTL ? 'משפחות אמיתיות, שינויים אמיתיים' : 'Real families, real transformations'}
        </p>

        <div className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5',
          isRTL ? 'text-right' : 'text-left'
        )}>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isRTL={isRTL}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
