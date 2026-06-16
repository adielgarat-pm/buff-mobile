import {
  selectRecommendation,
  STREAK_CELEBRATE_THRESHOLD,
  type RecommendationState,
} from '../recommendationEngine';

/** A baseline "nothing applies" state; each test overrides only what it needs. */
const base: RecommendationState = {
  childId:          'kid-1',
  childName:        'Emi',
  isPaused:         false,
  isLowVibe:        false,
  isLapsed:         false,
  hasStandaloneMed: false,
  streak:           0,
  topInsight:       null,
};

describe('selectRecommendation — ladder', () => {
  it('returns null when nothing applies (legacy insight card renders)', () => {
    expect(selectRecommendation(base)).toBeNull();
  });

  it('suppresses entirely while paused — even with lapse + low vibe', () => {
    const r = selectRecommendation({
      ...base, isPaused: true, isLowVibe: true, isLapsed: true, streak: 10,
    });
    expect(r).toBeNull();
  });

  it('low vibe → a warm sticker gesture', () => {
    const r = selectRecommendation({ ...base, isLowVibe: true });
    expect(r?.trigger).toBe('low-vibe');
    expect(r?.ctaType).toBe('send-sticker');
    expect(r?.i18nKey).toBe('low-vibe');
  });

  it('low vibe outranks lapse and streak', () => {
    const r = selectRecommendation({
      ...base, isLowVibe: true, isLapsed: true, streak: 10,
    });
    expect(r?.trigger).toBe('low-vibe');
  });

  it('lapse with no standalone med → establish one anchor (add-med)', () => {
    const r = selectRecommendation({ ...base, isLapsed: true, hasStandaloneMed: false });
    expect(r?.trigger).toBe('comeback');
    expect(r?.ctaType).toBe('add-med');
    expect(r?.i18nKey).toBe('comeback-anchor');
  });

  it('lapse with an existing med → reconnect gesture (sticker)', () => {
    const r = selectRecommendation({ ...base, isLapsed: true, hasStandaloneMed: true });
    expect(r?.trigger).toBe('comeback');
    expect(r?.ctaType).toBe('send-sticker');
    expect(r?.i18nKey).toBe('comeback-reconnect');
  });

  it('lapse outranks a streak celebration', () => {
    const r = selectRecommendation({ ...base, isLapsed: true, streak: 10 });
    expect(r?.trigger).toBe('comeback');
  });

  it('streak at threshold with no insight → celebrate', () => {
    const r = selectRecommendation({ ...base, streak: STREAK_CELEBRATE_THRESHOLD });
    expect(r?.trigger).toBe('celebrate');
    expect(r?.ctaType).toBe('send-sticker');
  });

  it('streak below threshold → null', () => {
    const r = selectRecommendation({ ...base, streak: STREAK_CELEBRATE_THRESHOLD - 1 });
    expect(r).toBeNull();
  });

  it('a positive-streak insight (severity info) does not block celebration', () => {
    const r = selectRecommendation({
      ...base, streak: STREAK_CELEBRATE_THRESHOLD, topInsight: { severity: 'info' },
    });
    expect(r?.trigger).toBe('celebrate');
  });

  it('a low insight (attention/suggestion) is never hidden behind a celebration', () => {
    const attention = selectRecommendation({
      ...base, streak: 10, topInsight: { severity: 'attention' },
    });
    const suggestion = selectRecommendation({
      ...base, streak: 10, topInsight: { severity: 'suggestion' },
    });
    expect(attention).toBeNull();
    expect(suggestion).toBeNull();
  });

  it('carries childId into the id and payload (unique per kid)', () => {
    const r = selectRecommendation({ ...base, childId: 'kid-xyz', isLowVibe: true });
    expect(r?.childId).toBe('kid-xyz');
    expect(r?.id).toContain('kid-xyz');
  });
});
