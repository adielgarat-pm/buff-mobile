import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface DisclaimerFooterProps {
  variant?: 'short' | 'full';
}

export default function DisclaimerFooter({ variant = 'short' }: DisclaimerFooterProps) {
  const { t } = useTranslation();
  return (
    <Text style={styles.text}>
      {variant === 'short' ? t('disclaimer.short') : t('disclaimer.full')}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});
