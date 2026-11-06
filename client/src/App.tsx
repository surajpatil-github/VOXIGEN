import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { KundaliPage } from './pages/KundaliPage';
import { FreeKundaliPage } from './pages/FreeKundaliPage';
import { HoroscopePage } from './pages/HoroscopePage';
import { PanchangPage } from './pages/PanchangPage';
import { CompatibilityPage } from './pages/CompatibilityPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { VoicePage } from './pages/VoicePage';
import { ContactPage } from './pages/ContactPage';
import { BirthChartPage } from './pages/BirthChartPage';
import { GeneKeysPage } from './pages/GeneKeysPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-cosmic-navy text-cosmic-ivory">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/kundali/:id" element={<KundaliPage />} />
          <Route path="/free-kundali" element={<FreeKundaliPage />} />
          <Route path="/horoscope" element={<HoroscopePage />} />
          <Route path="/panchang" element={<PanchangPage />} />
          <Route path="/compatibility" element={<CompatibilityPage />} />
          <Route path="/gene-keys" element={<GeneKeysPage />} />
          <Route path="/human-design" element={<BirthChartPage kind="human-design" />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          {/* Fallback 404 */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};
