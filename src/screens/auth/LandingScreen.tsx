import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguagePicker from '../../components/LanguagePicker';
import type { RootStackParamList } from '../../navigation/types';
import { PASTEL_MODE as T } from '../../theme/modes';
import reviewsData from '../../data/reviews.json';

type Nav = StackNavigationProp<RootStackParamList, 'Landing'>;

const BG = T.canvas; // #F4F0FA
const ACCENT = T.accent; // #7C3AED
const TEXT_DARK = T.text; // #1a1636
const TEXT_MUTED = T.textMuted; // #6B5B8A

export default function LandingScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { isRTL, direction } = useLanguage();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <LanguagePicker />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../../assets/BUFF_LOGO_LAVENDER.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />

          <Text style={[styles.heroHeadline, { textAlign: 'center' }]}>
            {t('landing.heroHeadline')}
          </Text>
          <Text style={[styles.heroHeadline2, { textAlign: 'center' }]}>
            {t('landing.heroHeadline2')}
          </Text>

          <Text style={[styles.heroSubtitle, { textAlign: 'center' }]}>
            {t('landing.heroSub')}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('RoleSelection')}
            style={styles.ctaButton}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>{t('landing.startFree')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Benefits Section ── */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
            {t('landing.benefitsTitle')}
          </Text>

          <BenefitCard
            emoji="🏔️"
            title={t('landing.benefit1Title')}
            desc={t('landing.benefit1Desc')}
          />
          <BenefitCard
            emoji="📊"
            title={t('landing.benefit2Title')}
            desc={t('landing.benefit2Desc')}
          />
          <BenefitCard
            emoji="🤝"
            title={t('landing.benefit3Title')}
            desc={t('landing.benefit3Desc')}
          />
        </View>

        {/* ── Testimonials Section ── */}
        <View style={styles.testimonialsSection}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
            {isRTL ? 'מה הורים אומרים' : 'What Parents Say'}
          </Text>
          <Text style={[styles.testimonialsSub, { textAlign: 'center' }]}>
            {isRTL ? 'משפחות אמיתיות, שינויים אמיתיים' : 'Real families, real transformations'}
          </Text>

          <View style={styles.reviewsList}>
            {reviewsData.slice(0, 3).map((review: any) => (
              <ReviewCard key={review.id} review={review} isRTL={isRTL} />
            ))}
          </View>
        </View>

        {/* ── Bottom CTA Section ── */}
        <View style={styles.bottomCtaSection}>
          <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>
            {t('landing.ctaTitle')}
          </Text>
          <Text style={[styles.ctaSubtitle, { textAlign: 'center' }]}>
            {t('landing.ctaSubtitle')}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('RoleSelection')}
            style={styles.ctaButton}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaButtonText}>{t('landing.ctaButton')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('landing.foundedBy')}
          </Text>
          <Text style={styles.footerResearch}>
            {t('landing.researchBacked')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BenefitCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <View style={styles.benefitCard}>
      <Text style={styles.benefitEmoji}>{emoji}</Text>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDesc}>{desc}</Text>
    </View>
  );
}

function ReviewCard({ review, isRTL }: { review: any; isRTL: boolean }) {
  const text = isRTL ? review.review_text : (review.translated_text_en || review.review_text);
  const name = isRTL ? review.display_name : (review.display_name_en || review.display_name);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.stars}>
          {Array.from({ length: review.rating }).map((_, i) => (
            <Text key={i} style={styles.star}>⭐</Text>
          ))}
        </View>
      </View>

      <Text style={styles.reviewName}>{name}</Text>
      <Text style={[styles.reviewText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={3}>
        "{text}"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroLogo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  heroHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT_DARK,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroHeadline2: {
    fontSize: 28,
    fontWeight: '900',
    color: ACCENT,
    lineHeight: 36,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: TEXT_MUTED,
    lineHeight: 24,
    marginBottom: 32,
  },

  // Benefits
  benefitsSection: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    gap: 16,
  },
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#E9DCFF',
  },
  benefitEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  benefitDesc: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
  },

  // Testimonials
  testimonialsSection: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    backgroundColor: '#FAFAFA',
  },
  testimonialsSub: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 20,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E9DCFF',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 12,
  },
  reviewName: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 16,
  },

  // CTA Section
  bottomCtaSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT_DARK,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  ctaSubtitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    lineHeight: 22,
    marginBottom: 28,
  },

  ctaButton: {
    backgroundColor: ACCENT,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: '80%',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E9DCFF',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  footerResearch: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 16,
  },
});
