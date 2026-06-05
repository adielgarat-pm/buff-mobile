import { stableChildCreds, legacyChildCreds } from '../childAuth';

describe('childAuth — stableChildCreds', () => {
  it('keys email on the immutable profile id (hyphens stripped) and is RFC-valid ASCII', () => {
    const { email, password } = stableChildCreds('74638016-e487-4dfd-8a98-35c5eb702088');
    expect(email).toBe('child_74638016e4874dfd8a9835c5eb702088@buff.app');
    expect(email).toMatch(/^[a-z0-9_]+@buff\.app$/);
    expect(password).toBe('74638016-e487-4dfd-8a98-35c5eb702088_buff_stable_2026');
  });

  it('is deterministic — same id → same creds', () => {
    const id = 'abcdef01-2345-6789-abcd-ef0123456789';
    expect(stableChildCreds(id)).toEqual(stableChildCreds(id));
  });

  it('different ids → different emails (no collision)', () => {
    const a = stableChildCreds('11111111-1111-1111-1111-111111111111').email;
    const b = stableChildCreds('22222222-2222-2222-2222-222222222222').email;
    expect(a).not.toBe(b);
  });
});

describe('childAuth — legacyChildCreds (back-compat, must match pre-fix derivation)', () => {
  // The decisive case: this must equal Liah's REAL production auth email
  // (c5dc5d95d4@buff.app) so the legacy fallback signs already-linked kids in.
  it("Hebrew 'ליה' → matches the real prod auth user", () => {
    expect(legacyChildCreds('ליה', 'CWYNQB').email).toBe('c5dc5d95d4@buff.app');
    expect(legacyChildCreds('ליה', 'CWYNQB').password).toBe('c5dc5d95d4_CWYNQB_buff2026');
  });

  it("Latin names are byte-identical to the legacy formula (no regression)", () => {
    expect(legacyChildCreds('Leia', 'X').email).toBe('leia@buff.app');
    expect(legacyChildCreds('Noa Morag', 'X').email).toBe('noa_morag@buff.app');
  });

  it("distinct Hebrew names → distinct emails", () => {
    expect(legacyChildCreds('דני', 'X').email).toBe('c5d35e05d9@buff.app');
    expect(legacyChildCreds('דני', 'X').email).not.toBe(legacyChildCreds('ליה', 'X').email);
  });

  it("password embeds the upper-cased family code", () => {
    expect(legacyChildCreds('Leia', 'abc123').password).toBe('leia_ABC123_buff2026');
  });
});
