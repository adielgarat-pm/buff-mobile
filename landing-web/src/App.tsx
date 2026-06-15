import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Landing from '@/components/Landing';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import { AboutPage } from '@/components/AboutPage';
import { useNavigate } from 'react-router-dom';

function AboutRoute() {
  const navigate = useNavigate();
  return <AboutPage onBack={() => navigate('/')} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/about" element={<AboutRoute />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
