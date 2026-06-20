/**
 * useCaptureConsent — one-time consent gate before the first capture.
 *
 * Children's-app requirement: the parent must knowingly agree that captured
 * content is sent to an AI service for processing. Stored per device.
 * See docs/sessions/parent-capture/ (Privacy).
 */

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'buff_parent_capture_consent_v1';

export function useCaptureConsent() {
  // null = still loading; true/false = known
  const [consented, setConsented] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => alive && setConsented(v === '1'))
      .catch(() => alive && setConsented(false));
    return () => {
      alive = false;
    };
  }, []);

  const grant = useCallback(async () => {
    setConsented(true);
    try {
      await AsyncStorage.setItem(KEY, '1');
    } catch (e) {
      console.error('[useCaptureConsent] save error:', e);
    }
  }, []);

  return { consented, grant };
}
