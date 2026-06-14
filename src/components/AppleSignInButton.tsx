import { useEffect, useState } from 'react';
import { Alert, Platform, StyleProp, ViewStyle } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  // SIGN_IN for the login screen, SIGN_UP for the signup screen — Apple
  // localizes the label natively, so no i18n strings are needed here.
  mode: 'signin' | 'signup';
  style?: StyleProp<ViewStyle>;
}

// Rendered only on iOS devices that support Sign in with Apple (Guideline 4.8).
// Android and web render nothing.
export default function AppleSignInButton({ mode, style }: Props) {
  const { signInWithApple } = useAuth();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    const { error } = await signInWithApple();
    setLoading(false);
    if (error) Alert.alert('Apple sign-in failed', error.message);
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={
        mode === 'signup'
          ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
          : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
      }
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={[{ height: 52, marginBottom: 12 }, style]}
      onPress={handlePress}
    />
  );
}
