/**
 * FoundingHundredScreen — Founding 100 lifetime offer.
 *
 * Shows the offer table, a live "spots left" counter (via Postgres RPC
 * get_founding_count()), and a tier-aware CTA that purchases either the
 * $99 SKU (sales 1..50) or the $149 SKU (sales 51..100).
 *
 * When count >= 100, renders a "Founding 100 closed" empty state with
 * a fallback CTA to the regular Family Plan.
 *
 * Source SPEC: docs/sessions/founding-100-payment/SPEC.md §Phases / Phase 3
 *
 * TODO: i18n — currently English-only. Add HE translations once core flow
 *       is verified working.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../hooks/useSubscription';
import { FoundingBadge } from '../components/FoundingBadge';
import { supabase } from '../integrations/supabase/client';

// Pricing tier boundary — sales 1..50 are $99, sales 51..100 are $149.
const TIER_99_LIMIT = 50;
const HARD_CAP = 100;

export default function FoundingHundredScreen() {
  const navigation = useNavigation();
  const {
    purchaseLifetime,
    isFoundingMember,
    foundingMemberNumber,
  } = useSubscription();

  const [salesCount, setSalesCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch the live counter ───────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_founding_count');
      if (error) {
        console.warn('[FoundingHundredScreen] count fetch error:', error);
        setSalesCount(0); // fail open — show as if 0 sold so CTA is enabled
      } else {
        setSalesCount(data ?? 0);
      }
    } catch (err) {
      console.warn('[FoundingHundredScreen] count fetch exception:', err);
      setSalesCount(0);
    } finally {
      setCountLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // ── Derived state ────────────────────────────────────────────────────────
  const count = salesCount ?? 0;
  const isCapReached = count >= HARD_CAP;
  const currentTier: 99 | 149 = count < TIER_99_LIMIT ? 99 : 149;
  const spotsLeftAtCurrentTier = currentTier === 99
    ? TIER_99_LIMIT - count
    : HARD_CAP - count;
  const totalSpotsLeft = HARD_CAP - count;

  // ── Purchase flow ────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    setError(null);
    setPurchasing(true);
    try {
      await purchaseLifetime(currentTier);
      // Refresh count so the UI reflects the new state
      await fetchCount();
      // Stay on screen — user will see the "you're a founder #N" view after
      // the profile flag propagates (refreshed in purchaseLifetime).
    } catch (err: unknown) {
      if (!(err as { userCancelled?: boolean })?.userCancelled) {
        setError(
          err instanceof Error
            ? err.message
            : 'Purchase failed. Please try again.',
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  // ── Render: user is already a Founding Member ────────────────────────────
  if (isFoundingMember && foundingMemberNumber) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <CloseButton />
          <Text style={styles.crown}>🎉</Text>
          <Text style={styles.heading}>You're already in.</Text>
          <View style={{ alignSelf: 'center', marginVertical: 20 }}>
            <FoundingBadge memberNumber={foundingMemberNumber} variant="large" />
          </View>
          <Text style={styles.sub}>
            Thank you for being one of the first 100. Your access is
            lifetime — no renewals, no future price hikes, ever.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render: loading ──────────────────────────────────────────────────────
  if (countLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A8E63E" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: sold out ─────────────────────────────────────────────────────
  if (isCapReached) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <CloseButton />
          <Text style={styles.crown}>🌟</Text>
          <Text style={styles.heading}>The Founding 100 has closed.</Text>
          <Text style={styles.sub}>
            All 100 founding spots are claimed. Welcome — start free, upgrade
            to Family Plan ($9/mo) when ready.
          </Text>
          <TouchableOpacity
            style={styles.fallbackCta}
            onPress={() => navigation.navigate('Paywall' as never)}
          >
            <Text style={styles.fallbackCtaText}>See Family Plan</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render: offer ────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CloseButton />

        {/* Hero */}
        <Text style={styles.eyebrow}>FOUNDING 100</Text>
        <Text style={styles.heading}>Be one of the first 100.</Text>
        <Text style={styles.sub}>
          Lifetime BUFF Family Plan. One payment. Forever.
        </Text>

        {/* Live counter */}
        <View style={styles.counterCard}>
          <Text style={styles.counterNumber}>{count}</Text>
          <Text style={styles.counterLabel}>of 100 claimed</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((count / HARD_CAP) * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.spotsLeft}>
            {spotsLeftAtCurrentTier} spots left at ${currentTier}
          </Text>
        </View>

        {/* What you get */}
        <View style={styles.featureCard}>
          <FeatureRow text="Family Plan equivalent — 3 kids, unlimited tasks" />
          <FeatureRow text="Founding Member badge in your profile" />
          <FeatureRow text="Priority email channel direct to Adi" />
          <FeatureRow text="All future features included free" />
          <FeatureRow text="Permanent price lock — no future increases" />
          <FeatureRow text="30-day satisfaction guarantee" />
        </View>

        {/* Inline error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaCard, purchasing && styles.ctaCardDisabled]}
          onPress={handlePurchase}
          disabled={purchasing}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color="#1a1636" />
          ) : (
            <>
              <Text style={styles.ctaPrice}>${currentTier}</Text>
              <Text style={styles.ctaLabel}>
                Claim spot #{count + 1} — lifetime access
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tier explainer */}
        <Text style={styles.tierExplainer}>
          Spots 1–50: $99 · Spots 51–100: $149
          {currentTier === 99 && totalSpotsLeft - spotsLeftAtCurrentTier > 0
            ? ` · After spot #50 price rises to $149`
            : ''}
        </Text>

        {/* Fine print */}
        <Text style={styles.finePrint}>
          One-time payment. Lifetime access, no renewals.
          Cancel within 30 days for a full refund.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents

function CloseButton() {
  const navigation = useNavigation();
  if (!navigation.canGoBack()) return null;
  return (
    <TouchableOpacity
      style={styles.closeBtn}
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Text style={styles.closeBtnText}>✕</Text>
    </TouchableOpacity>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureCheck}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1a1636' },
  scroll: { padding: 24, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  closeBtnText: { color: '#A78BFA', fontSize: 18, fontWeight: '600' },

  crown: { fontSize: 52, marginBottom: 8 },
  eyebrow: {
    color: '#A8E63E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heading: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sub: {
    color: '#A78BFA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  counterCard: {
    width: '100%',
    backgroundColor: '#2D2546',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 230, 62, 0.3)',
  },
  counterNumber: {
    color: '#A8E63E',
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 60,
  },
  counterLabel: {
    color: '#A78BFA',
    fontSize: 14,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#1a1636',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#A8E63E' },
  spotsLeft: { color: '#fff', fontSize: 13, fontWeight: '600' },

  featureCard: {
    width: '100%',
    backgroundColor: '#2D2546',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  featureCheck: { color: '#A8E63E', fontSize: 18, fontWeight: '700', marginRight: 12 },
  featureText: { color: '#fff', fontSize: 15, flex: 1, lineHeight: 20 },

  errorBox: {
    backgroundColor: 'rgba(255,49,49,0.15)',
    borderColor: '#FF3131',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: { color: '#FF8888', fontSize: 14, textAlign: 'center' },

  ctaCard: {
    width: '100%',
    backgroundColor: '#A8E63E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaCardDisabled: { opacity: 0.6 },
  ctaPrice: { color: '#1a1636', fontSize: 36, fontWeight: '900' },
  ctaLabel: { color: '#1a1636', fontSize: 14, fontWeight: '600', marginTop: 4 },

  tierExplainer: {
    color: '#A78BFA',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },

  finePrint: {
    color: '#7C3AED',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 24,
  },

  fallbackCta: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
  },
  fallbackCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
