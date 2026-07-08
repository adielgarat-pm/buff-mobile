import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Camera, Pause, Trophy, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import logo from '@/assets/buff-logo-no-bg.png';

type Rec = { h: string; p: string; tip?: string };
type Help = { viz: 'import' | 'pack' | 'pause' | 'win'; b: string; s: string };

const CONTENT = {
  he: {
    metaTitle: 'מדריך הורים לקיץ — מעבר משגרת לימודים לחופש | BUFF',
    metaDesc: 'מדריך הורים למעבר משגרת לימודים לחופש עבור ילדים עם הפרעת קשב: 7 צעדים מעשיים לשמור על שגרה ומבנה בקיץ, בלי לאבד את הקצב.',
    other: 'EN', back: 'חזרה',
    heroEyebrow: 'מדריך הורים · קיץ',
    heroTitle: 'מעבר משגרת לימודים לחופש — בלי לאבד את הקצב',
    heroLede: 'עבור ילדים עם הפרעת קשב, סוף השנה הוא לא רק סיבה למסיבה. הוא מביא איתו אובדן פתאומי של מבנה, מעברים בין קייטנות וסביבות חדשות, וציוד שמשתנה כל יום. הנה איך לעבור את תקופת המעבר הזו ברוגע, עם כלים מעשיים שיעזרו לכם לשמור על העוגנים החשובים.',
    whyEyebrow: 'רקע', whyTitle: 'למה זה כל כך מאתגר?',
    whyIntro: 'המוח הקשוב נשען על מבנה וחזרתיות. כשהמסגרת של בית הספר נעלמת בבת אחת, מופיעים רגעים של חוסר אונים, שכחת ציוד וקושי להניע את הבוקר. הבשורה הטובה: אתן לא צריכות שגרה נוקשה או ימי חופש עמוסים באטרקציות — אתן פשוט צריכות כמה עוגנים ברורים.',
    points: [
      { b: 'פחות מבנה', s: 'בלי מערכת שעות קבועה, כל בוקר מתחיל מסימן שאלה.' },
      { b: 'סביבות משתנות', s: 'קייטנה, בריכה, טיולים — חוקי המשחק והדרישות משתנים כל הזמן.' },
      { b: 'רכבת הרים של ציוד', s: 'בגד ים היום, נעליים סגורות מחר — קל מאוד לשכוח את מה שבאמת צריך.' },
    ],
    recsEyebrow: 'המלצות', recsTitle: '7 צעדים למעבר רך', recsNote: 'מהעוגן הבסיסי אל הפרטים.', tipLabel: 'איך BUFF עוזרת?',
    recs: [
      { h: 'שמרו על עוגנים קבועים', p: 'לא צריך לנהל לו״ז צבאי. מספיק לבחור 2–3 נקודות קבועות ביום (שעת קימה, ארוחת בוקר או שעת שינה) כדי לתת למוח מסגרת יציבה גם כשהמשך היום פתוח לחלוטין.', tip: 'אפשר להשאיר משימות עוגן ספציפיות פעילות גם במהלך החופש.' },
      { h: 'הורידו הילוך בהדרגה', p: 'אל תפילו את כל המבנה ביום אחד. בשבוע הראשון של החופש מומלץ להוריד קצב בצורה הדרגתית. לכבות את המנוע לחלוטין מקשה מאוד על הנעת השגרה מחדש בהמשך.' },
      { h: 'הפכו את מחר לנראה לעין', p: 'כשהילדים יודעים בדיוק מה הולך לקרות מחר — לאן הולכים ומה לוקחים — רמת החרדה יורדת, יש פחות הפתעות, ופחות ויכוחים מתישים בבוקר.', tip: 'ייבוא לוח הקייטנה מציג לילד או לילדה את תכנית המחר באופן אוטומטי וויזואלי.' },
      { h: 'הכינו את התיק בערב שלפני', p: 'קיץ שווה לציוד דינמי (בגד ים, כובע, קרם הגנה, בקבוק מים). רשימה קבועה שמכינים ומסדרים יחד בערב מורידה את עומס הבוקר ומצמצמת את הלחץ למינימום.' },
      { h: 'תנו להם לארוז לבד (זה הזמן לתרגל!)', p: 'אריזת התיק היא אימון מעולה למיומנויות של תפקודים ניהוליים. החופש, כשאין את הלחץ של ההסעות לבית הספר, הוא ההזדמנות המושלמת לתרגל את זה — בקצב שלהם.', tip: 'הילדים מסמנים בעצמם ובאופן עצמאי מה כבר נכנס לתיק.' },
      { h: 'תכננו ימי מנוחה — בלי רגשות אשם', p: 'לא כל יום חייב להיות הפקה. יום רגוע בבית הוא חלק חיוני מהתכנית, לא כישלון שלה. עצירה יזומה ומתוכננת עדיפה תמיד על התמוטטות של סוף שבוע עמוס.', tip: 'כפתור ה‑Pause עוצר את השגרה לטובת יום מנוחה, ומאפשר להמשיך בקלות בדיוק מאיפה שעצרתם, כשאתם מוכנים.' },
      { h: 'חגגו את ה‑70%', p: 'הקיץ הוא לא מבחן ולא תחרות. אם רוב הדברים שתכננתם קרו — זה יום מנצח! שלושת הדברים שלא הספקתם לא הורסים את ההצלחה של מה שכן נעשה.' },
    ] as Rec[],
    helpEyebrow: 'BUFF', helpTitle: 'איך BUFF תומכת במעבר שלכם', helpNote: 'תצוגות להמחשה — כך זה נראה באפליקציה.',
    help: [
      { viz: 'import', b: 'ייבוא לוח הקייטנה', s: 'מצלמים או מדביקים את הלו״ז — והאפליקציה שולפת אוטומטית את הציוד הנדרש, כולל פריטי „בתיק כל יום”.' },
      { viz: 'pack', b: 'כרטיס אריזה חכם', s: 'כל מה שצריך לארוז להיום ולמחר מרוכז במקום אחד. הילדים מסמנים ומנהלים את המשימה בעצמם.' },
      { viz: 'pause', b: 'חופש בלי אשמה', s: 'יום בלי פעילות? לוחצים על Pause, לוקחים נשימה וממשיכים כשהאנרגיות חוזרות.' },
      { viz: 'win', b: 'מדד ההצלחה של BUFF', s: 'המוצר בנוי כך שיום לא‑מושלם הוא עדיין סיפור הצלחה — מחזקים את תחושת המסוגלות.' },
    ] as Help[],
    tagsTitle: 'נושאים',
    tags: ['ADHD בקיץ', 'מעבר משגרה לחופש', 'שגרה לילד עם הפרעת קשב', 'הכנה לקייטנה', 'תפקודים ניהוליים', 'אריזת תיק לילדים', 'בוקר רגוע', 'הורות ADHD'],
    tagline: 'עד שהם כבר לא יזדקקו לנו.', footSub: 'BUFF — אפליקציית השגרה שהילדים שלכם גדלים ממנה.',
    vizPack: 'נארוז יחד?', vizSwim: 'בגד ים', vizHat: 'כובע', vizWater: 'בקבוק מים',
    vizImportHead: 'מערכת שעות · קייטנה', vizImportRow: 'פעילות · 08:00', vizImportChip: 'ציוד יומי: בגד ים, כובע, מים',
    vizRest: 'מנוחה — נמשיך כשמוכנים', vizWin: 'יום מנצח',
  },
  en: {
    metaTitle: "Parents' Summer Guide — School Routine to Break (ADHD) | BUFF",
    metaDesc: 'A practical parent guide for the school-to-summer transition with an ADHD child: 7 steps to keep routine and structure over the break, without losing momentum.',
    other: 'עב', back: 'Back',
    heroEyebrow: "Parents' guide · Summer",
    heroTitle: 'Transitioning to break — without losing the momentum',
    heroLede: "For a child with ADHD, the end of the school year isn't just a celebration—it's a sudden loss of structure, an introduction to unfamiliar environments, and a daily shuffle of changing gear. Here's how to navigate this transition smoothly, with practical tools to keep your core anchors steady.",
    whyEyebrow: 'Background', whyTitle: "Why it's challenging",
    whyIntro: "The ADHD brain thrives on structure and predictability. When the school routine vanishes overnight, it triggers moments of directionlessness, forgotten gear, and morning friction. The good news: you don't need a rigid, jam-packed schedule—you just need a few clear anchors.",
    points: [
      { b: 'Less structure', s: 'Without a fixed timetable, every morning starts from scratch.' },
      { b: 'Shifting environments', s: 'Camp, pool, day trips—each comes with new rules and expectations.' },
      { b: 'The gear carousel', s: "Swimwear today, closed shoes tomorrow—it's easy to misplace essentials." },
    ],
    recsEyebrow: 'Recommendations', recsTitle: '7 steps to a smooth transition', recsNote: 'From core anchors to small details.', tipLabel: 'How BUFF helps:',
    recs: [
      { h: 'Keep a few fixed anchors', p: "You don't need to run a military boot camp. Pick 2–3 daily anchors (wake-up time, breakfast, or bedtime) to give the brain a sense of stability, even when the rest of the day is wide open.", tip: 'Keep specific anchor tasks active and visible throughout the summer.' },
      { h: 'Downshift gradually', p: "Don't drop the entire routine in one day. Use the first week of break to ease into a slower pace. Turning the engine off completely makes restarting the routine down the line much harder." },
      { h: 'Make tomorrow visual', p: 'When kids know exactly what tomorrow looks like—where they are going and what they need—anxiety drops, surprises vanish, and morning power struggles disappear.', tip: "Importing the camp schedule automatically displays tomorrow's plan in a clear, visual way." },
      { h: 'Pack the bag the night before', p: 'Summer means dynamic gear (swimsuits, sunscreen, hats, water bottles). Setting up a permanent checklist and packing the night before reduces morning friction to zero.' },
      { h: 'Let them pack independently', p: 'Packing a bag is an excellent workout for executive dysfunction. Summer, free from the morning school-bus rush, is the perfect time to let them practice this skill at their own pace.', tip: 'Kids independently check off items as they place them into their bags.' },
      { h: 'Schedule rest days—guilt-free', p: 'Not every day needs to be a big production. A quiet day at home is a vital part of the plan, not a failure. A planned pause is always better than a chaotic burnout.', tip: 'The Pause button halts the routine for a rest day, letting you pick up right where you left off when you’re ready.' },
      { h: 'Celebrate the 70%', p: "Summer is not a test. If most of what you planned happened, it's a winning day. The three things that didn't get done don't ruin the success of everything else." },
    ] as Rec[],
    helpEyebrow: 'BUFF', helpTitle: 'How BUFF supports your transition', helpNote: "Illustrative previews — here's how it looks in the app.",
    help: [
      { viz: 'import', b: 'Camp calendar import', s: 'Take a photo or paste the schedule—BUFF extracts the daily agenda and flags required gear automatically.' },
      { viz: 'pack', b: 'Smart packing card', s: 'Everything needed for today and tomorrow is in one place. Kids check things off and take ownership.' },
      { viz: 'pause', b: 'Guilt-free down time', s: 'A day with zero plans? Hit Pause, take a breath, and resume whenever their batteries are recharged.' },
      { viz: 'win', b: 'The BUFF success metric', s: 'The app is built so an imperfect day is still celebrated as a win, building long-term competence.' },
    ] as Help[],
    tagsTitle: 'Topics',
    tags: ['ADHD summer routine', 'school-to-summer transition', 'summer structure for ADHD kids', 'camp preparation', 'executive function', 'bag packing for kids', 'calm mornings', 'ADHD parenting'],
    tagline: "Until they don't need us anymore.", footSub: 'BUFF — the routine app your child grows out of.',
    vizPack: 'Pack together?', vizSwim: 'Swimsuit', vizHat: 'Hat', vizWater: 'Water bottle',
    vizImportHead: 'Camp schedule', vizImportRow: 'Activity · 08:00', vizImportChip: 'Daily gear: swimsuit, hat, water',
    vizRest: 'Rest — resume when ready', vizWin: 'A winning day',
  },
};

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

export default function SummerGuide() {
  const navigate = useNavigate();
  const { language, setLanguage, isRTL } = useLanguage();
  const c = CONTENT[language];

  useEffect(() => {
    document.title = c.metaTitle;
    setMeta('description', c.metaDesc);
    setMeta('keywords', [...CONTENT.he.tags, ...CONTENT.en.tags].join(', '));
    return () => { document.title = 'BUFF — ADHD Routine App for Kids & Teens'; };
  }, [c.metaTitle, c.metaDesc]);

  const toggleLang = () => {
    const next = language === 'he' ? 'en' : 'he';
    setLanguage(next);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url.toString());
  };

  const Viz = ({ kind }: { kind: Help['viz'] }) => {
    if (kind === 'pack') return (
      <div className="rounded-xl bg-secondary/60 border border-border p-3 mb-3 text-sm">
        <div className="font-extrabold text-xs mb-2">{c.vizPack}</div>
        <div className="flex items-center gap-2 py-1 text-muted-foreground line-through">
          <span className="grid place-items-center w-[18px] h-[18px] rounded-full bg-success text-primary-foreground text-[11px] font-black"><Check size={11} strokeWidth={3.5} /></span>{c.vizSwim}
        </div>
        <div className="flex items-center gap-2 py-1"><span className="w-[18px] h-[18px] rounded-full border-2 border-border" />{c.vizHat}</div>
        <div className="flex items-center gap-2 py-1"><span className="w-[18px] h-[18px] rounded-full border-2 border-border" />{c.vizWater}</div>
      </div>
    );
    if (kind === 'import') return (
      <div className="rounded-xl bg-secondary/60 border border-border p-3 mb-3 text-sm">
        <div className="font-extrabold text-xs mb-2">{c.vizImportHead}</div>
        <div className="py-1 font-semibold">{c.vizImportRow}</div>
        <span className="inline-block mt-1 text-[11px] font-extrabold text-primary bg-primary/12 rounded-full px-2 py-1">{c.vizImportChip}</span>
      </div>
    );
    if (kind === 'pause') return (
      <div className="rounded-xl bg-secondary/60 border border-border p-4 mb-3 grid place-items-center gap-2 text-center">
        <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground"><Pause size={18} fill="currentColor" /></span>
        <div className="text-muted-foreground text-xs font-semibold">{c.vizRest}</div>
      </div>
    );
    return (
      <div className="rounded-xl bg-secondary/60 border border-border p-4 mb-3 grid place-items-center gap-2 text-center">
        <div className="w-full max-w-[12rem] h-3 rounded-full bg-border overflow-hidden"><span className="block h-full rounded-full bg-success" style={{ width: '70%' }} /></div>
        <div className="font-extrabold text-2xl text-success">70%</div>
        <div className="text-muted-foreground text-xs font-semibold">{c.vizWin}</div>
      </div>
    );
  };

  const Eyebrow = ({ children }: { children: string }) => (
    <p className="text-xs font-extrabold tracking-[0.15em] uppercase text-primary mb-2">{children}</p>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 h-[62px] flex items-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 font-extrabold text-lg">
            <img src={logo} alt="BUFF" className="w-8 h-8 rounded-lg" /> BUFF
          </button>
          <div className="flex-1" />
          <button onClick={toggleLang} className="text-sm font-bold rounded-full border border-border px-3 py-1.5 hover:-translate-y-px transition-transform">{c.other}</button>
          <button onClick={() => navigate(-1)} className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
            {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}{c.back}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5">
        <section className="pt-12 pb-6">
          <Eyebrow>{c.heroEyebrow}</Eyebrow>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-balance">{c.heroTitle}</h1>
          <p className="text-lg text-muted-foreground max-w-[46ch] mt-4 font-medium">{c.heroLede}</p>
        </section>

        <section className="py-8 border-t border-border">
          <Eyebrow>{c.whyEyebrow}</Eyebrow>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{c.whyTitle}</h2>
          <p className="text-muted-foreground max-w-[62ch] mt-3 font-medium">{c.whyIntro}</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {c.points.map((p, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <b className="block font-extrabold mb-1">{p.b}</b>
                <span className="text-muted-foreground text-sm">{p.s}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 border-t border-border">
          <Eyebrow>{c.recsEyebrow}</Eyebrow>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{c.recsTitle}</h2>
          <p className="text-muted-foreground mt-2 font-medium">{c.recsNote}</p>
          <div className="grid gap-3 mt-6">
            {c.recs.map((r, i) => (
              <article key={i} className="rounded-2xl bg-card border border-border shadow-sm p-5 grid grid-cols-[auto_1fr] gap-4 items-start">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-extrabold tabular-nums shadow">{i + 1}</span>
                <div>
                  <h3 className="font-extrabold text-lg tracking-tight">{r.h}</h3>
                  <p className="text-muted-foreground mt-1 font-medium">{r.p}</p>
                  {r.tip && (
                    <div className="mt-3 text-sm bg-success/15 rounded-xl px-3 py-2 font-medium">
                      <b className="text-success font-extrabold">{c.tipLabel}</b> {r.tip}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="py-8 border-t border-border">
          <Eyebrow>{c.helpEyebrow}</Eyebrow>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{c.helpTitle}</h2>
          <p className="text-muted-foreground mt-2 font-medium">{c.helpNote}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {c.help.map((h, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
                <Viz kind={h.viz} />
                <b className="block font-extrabold mb-1">{h.b}</b>
                <span className="text-muted-foreground text-sm">{h.s}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 border-t border-border">
          <Eyebrow>{c.tagsTitle}</Eyebrow>
          <div className="flex flex-wrap gap-2 mt-2">
            {c.tags.map((tg, i) => (
              <span key={i} className="text-sm font-bold text-primary bg-card border border-border rounded-full px-3 py-1.5">{tg}</span>
            ))}
          </div>
        </section>

        <footer className="border-t border-border py-12 text-center">
          <p className="text-xl md:text-2xl font-extrabold tracking-tight text-balance">{c.tagline}</p>
          <p className="text-muted-foreground mt-2 text-sm font-medium">{c.footSub}</p>
        </footer>
      </main>
    </div>
  );
}
