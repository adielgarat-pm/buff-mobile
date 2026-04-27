/**
 * PaywallScreen — "Unlock BUFF Premium ✨"
 *
 * Two usage patterns:
 *   1. Via navigation:  navigation.navigate('Paywall', { childName })
 *   2. Inline render:   <PaywallScreen />   (e.g. in ChildRewardsScreen)
 *
 * Both patterns are supported via PaywallScreenContent (the real UI)
 * and a thin PaywallScreen wrapper that reads route params.
 *
 * Fetches real pricing from RevenueCat offerings on mount.
 * Falls back to hardcoded labels if offerings aren't available.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { PARENT_THEME as T } from '../theme';
import { useSubscription } from '../hooks/useSubscription';
import { getOfferings } from '../services/purchaseService';

type Route = RouteProp<RootStackParamList, 'Paywall'>;

const FEATURES = [
  { emoji: '🐾', text: 'Buddy pet — grows with consistency' },
  { emoji: '🛍️', text: 'Rewards shop — motivates with real prizes' },
  { emoji: '📊', text: 'Insights — track patterns over time' },
  { emoji: '🎨', text: 'Skins & themes — personalise the experience' },
  { emoji: '👨‍👩‍👧', text: 'Unlimited children' },
];

// ── Shared UI ─────────────────────────────────────────────────────────────────

function PaywallScreenContent({ childName = '' }: { childName?: string }) {
  const navigation = useNavigation();
  const { purchaseMonthly, purchaseYearly, restorePurchases } = useSubscription();

  const [monthlyLabel, setMonthlyLabel] = useState('$9.99 / month');
  const [yearlyLabel,  setYearlyLabel]  = useState('');
  const [savingsPct,   setSavingsPct]   = useState(0);
  const [purchasing,   setPurchasing]   = useState<'monthly' | 'yearly' | 'restore' | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  // ── Fetch real prices from RevenueCat ──────────────────────────────────────
  useEffect(() => {
    getOfferings().then(offerings => {
      const monthly = offerings?.current?.monthly;
      const yearly  = offerings?.current?.annual;

      if (monthly?.product?.priceString) {
        setMonthlyLabel(`${monthly.product.priceString} / month`);
      }

      if (yearly?.product?.priceString) {
        const yearlyPrice     = yearly.product.price;
        const monthlyPrice    = monthly?.product?.price ?? 9.99;
        const annualIfMonthly = monthlyPrice * 12;
        const savings = Math.round((1 - yearlyPrice / annualIfMonthly) * 100);
        setYearlyLabel(`${yearly.product.priceString} / year`);
        if (savings > 0) setSavingsPct(savings);
      }
    });
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handlePurchase = async (type: 'monthly' | 'yearly') => {
    setError(null);
    setPurchasing(type);
    try {
      if (type === 'monthly') await purchaseMonthly();
      else                    await purchaseYearly();
      if (navigation.canGoBack()) navigation.goBack();
    } catch (err: unknown) {
      if (!(err as { userCancelled?: boolean })?.userCancelled) {
        setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setPurchasing('restore');
    try {
      await restorePurchases();
      if (navigation.canGoBack()) navigation.goBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Restore failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const isBusy = purchasing !== null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        {navigation.canGoBack() && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Hero */}
        <Text style={styles.crown}>✨</Text>
        <Text style={styles.heading}>Unlock BUFF Premium</Text>
        {childName ? (
          <Text style={styles.sub}>
            Help <Text style={styles.subName}>{childName}</Text> build habits that stick
          </Text>
        ) : (
          <Text style={styles.sub}>Build habits that stick, together</Text>
        )}

        {/* Feature list */}
        <View style={styles.featureCard}>
          {FEATURES.map(f => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
              <Text style={styles.featureCheck}>✅</Text>
            </View>
          ))}
        </View>

        {/* Inline error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Yearly card (best value — shown first) */}
        {yearlyLabel ? (
          <TouchableOpacity
            style={[styles.priceCard, styles.priceCardHighlight]}
            onPress={() => handlePurchase('yearly')}
            activeOpacity={0.85}
            disabled={isBusy}
          >
            {savingsPct > 0 && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>Save {savingsPct}%</Text>
              </View>
            )}
            {purchasing === 'yearly' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.priceCardTitleLight}>Yearly</Text>
                <Text style={styles.priceCardPriceLight}>{yearlyLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Monthly card */}
        <TouchableOpacity
          style={styles.priceCard}
          onPress={() => handlePurchase('monthly')}
          activeOpacity={0.85}
          disabled={isBusy}
        >
          {purchasing === 'monthly' ? (
            <ActivityIndicator color={T.accent} />
          ) : (
            <>
              <Text style={[styles.priceCardTitle, { color: T.text }]}>Monthly</Text>
              <Text style={[styles.priceCardPrice, { color: T.accent }]}>{monthlyLabel}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Fine print */}
        <Text style={styles.finePrint}>
          Subscriptions auto-renew. Cancel any time in your App Store / Play Store settings.
        </Text>

        {/* Footer links */}
        <View style={styles.footerRow}>
          <TouchableOpacity onPress={handleRestore} disabled={isBusy}>
            {purchasing === 'restore' ? (
              <ActivityIndicator color={T.textMuted} size="small" />
            ) : (
              <Text style={styles.footerLink}>Restore purchases</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <Text style={styles.footerLink}>Privacy Policy</Text>
          <Text style={styles.footerDivider}>|</Text>
          <Text style={styles.footerLink}>Terms of Use</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Navigation wrapper (reads route params) ───────────────────────────────────

export default function PaywallScreen() {
  const route = useRoute<Route>();
  return <PaywallScreenContent childName={route.params?.childName ?? ''} />;
}

// ── Standalone export (rendered without navigator, e.g. ChildRewardsScreen) ──

export { PaywallScreenContent as PaywallContent };

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: T.bg },
  scroll:  { padding: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },

  closeBtn:     { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  closeBtnText: { color: T.textMuted, fontSize: 18, fontWeight: '600' },

  crown:   { fontSize: 52, marginBottom: 8 },
  heading: { color: T.text, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  sub:     { color: T.textMuted, fontSize: 16, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  subName: { color: T.accent, fontWeight: '700' },

  featureCard: {
    width: '100%', backgroundColor: T.card, borderRadius: 16,
    padding: 18, marginBottom: 24, borderWidth: 1, borderColor: T.cardBorder,
  },
  featureRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  featureEmoji: { fontSize: 20, width: 30 },
  featureText:  { flex: 1, color: T.text, fontSize: 14, fontWeight: '500' },
  featureCheck: { fontSize: 16 },

  errorBox:  {
    width: '100%', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },

  priceCard: {
    width: '100%', borderRadius: 16, padding: 20, marginBottom: 12,
    alignItems: 'center', borderWidth: 1.5, borderColor: T.cardBorder,
    backgroundColor: T.card, minHeight: 72, justifyContent: 'center',
  },
  priceCardHighlight: { backgroundColor: T.accent, borderColor: T.accent },

  priceCardTitle:      { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  priceCardPrice:      { fontSize: 18, fontWeight: '800' },
  priceCardTitleLight: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  priceCardPriceLight: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '800' },

  savingsBadge: {
    position: 'absolute', top: -10, right: 16,
    backgroundColor: '#10B981', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  savingsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  finePrint: {
    color: T.textMuted, fontSize: 11, textAlign: 'center',
    lineHeight: 16, marginTop: 4, marginBottom: 20,
  },

  footerRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  footerLink:    { color: T.textMuted, fontSize: 12, textDecorationLine: 'underline' },
  footerDivider: { color: T.cardBorder, fontSize: 12 },
});
