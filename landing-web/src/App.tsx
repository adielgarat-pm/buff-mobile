import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Landing from '@/components/Landing';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Refund from '@/pages/Refund';
import Pricing from '@/pages/Pricing';
import Join from '@/pages/Join';
import JoinRedirect from '@/pages/JoinRedirect';
import SummerGuide from '@/pages/SummerGuide';
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
          <Route path="/refund" element={<Refund />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* Two /join meanings, both load-bearing — don't collapse them:
              /join?ref=CODE   → Join         (PARENT referral hop → RoleSelection?ref=)
              /join/CODE       → JoinRedirect (CHILD smart invite → App Link /
                                 Play Store + referrer / Web PWA ChildJoin) */}
          <Route path="/join" element={<Join />} />
          <Route path="/join/:code" element={<JoinRedirect />} />
          <Route path="/summer" element={<SummerGuide />} />
          <Route path="/about" element={<AboutRoute />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
