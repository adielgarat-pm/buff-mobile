import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { profile, familyShortCode, signOut } = useAuth();
  const { isSubscribed } = useSubscription();

  const isChild = profile?.role === 'child';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isChild ? '#0F0F1A' : '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: isChild ? '#A78BFA' : '#6D28D9',
          marginBottom: 8,
        }}
      >
        BUFF
      </Text>

      <Text
        style={{
          fontSize: 16,
          color: isChild ? '#E5E7EB' : '#374151',
          marginBottom: 4,
        }}
      >
        {profile?.display_name ?? ''}
      </Text>

      <Text
        style={{
          fontSize: 13,
          color: isChild ? '#6B7280' : '#9CA3AF',
          marginBottom: 4,
        }}
      >
        {profile?.role === 'parent' ? 'Parent' : 'Child'} · {isSubscribed ? 'Subscribed' : 'Free'}
      </Text>

      {familyShortCode && (
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
          Family Code: {familyShortCode}
        </Text>
      )}

      <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 32 }}>
        {t('app.tagline')}
      </Text>

      <TouchableOpacity
        onPress={signOut}
        style={{
          borderWidth: 1,
          borderColor: '#7C3AED',
          borderRadius: 10,
          paddingHorizontal: 32,
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: '#7C3AED', fontWeight: '600' }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
