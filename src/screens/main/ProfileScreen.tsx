import { View, Text } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { profile } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
        {profile?.display_name ?? 'Profile'}
      </Text>
      <Text style={{ color: '#6B7280' }}>Role: {profile?.role}</Text>
    </View>
  );
}
