import { LanguageProvider } from '@/contexts/LanguageContext';
import Landing from '@/components/Landing';

export default function App() {
  return (
    <LanguageProvider>
      <Landing />
    </LanguageProvider>
  );
}
