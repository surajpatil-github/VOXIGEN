import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-cosmic-navy border-t border-cosmic-border-subtle pt-16 pb-12 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-cosmic-border-subtle">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cosmic-purple to-cosmic-indigo border border-cosmic-gold/50 flex items-center justify-center shadow-gold">
                <svg viewBox="0 0 100 100" className="w-5 h-5 text-cosmic-gold stroke-current fill-none stroke-[6]">
                  <polygon points="50,10 90,50 50,90 10,50" />
                  <circle cx="50" cy="50" r="16" className="fill-cosmic-gold" />
                </svg>
              </div>
              <span className="font-display text-2xl font-bold tracking-wider text-cosmic-ivory">
                VOXIGEN
              </span>
            </Link>

            <p className="text-cosmic-gold font-display text-base italic">
              “Discover Your Cosmic Blueprint.”
            </p>

            <p className="text-xs text-cosmic-lavender/70 leading-relaxed max-w-md font-sans">
              Voxigen combines high-precision astronomical ephemeris algorithms with classical Vedic Jyotish principles to reveal your true natal blueprint, planetary dignities, divisional vargas, and karmic life cycles.
            </p>

            <div className="flex items-center gap-2 text-xs text-cosmic-lavender/60">
              <Shield className="w-4 h-4 text-cosmic-gold" />
              <span>Sidereal Lahiri Ayanamsha • Whole Sign Houses • 100% Private</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-semibold text-cosmic-ivory tracking-wider uppercase mb-4">
              Astrology Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-cosmic-lavender/80 font-sans">
              <li>
                <Link to="/free-kundali" className="hover:text-cosmic-gold transition-colors">
                  Free Janam Kundali
                </Link>
              </li>
              <li>
                <Link to="/horoscope" className="hover:text-cosmic-gold transition-colors">
                  Daily Vedic Horoscope
                </Link>
              </li>
              <li>
                <Link to="/panchang" className="hover:text-cosmic-gold transition-colors">
                  Daily Vedic Panchang
                </Link>
              </li>
              <li>
                <Link to="/compatibility" className="hover:text-cosmic-gold transition-colors">
                  Ashtakoot Gun Milan
                </Link>
              </li>
            </ul>
          </div>

          {/* About & Legal */}
          <div>
            <h4 className="font-display text-sm font-semibold text-cosmic-ivory tracking-wider uppercase mb-4">
              Company & Philosophy
            </h4>
            <ul className="space-y-2.5 text-xs text-cosmic-lavender/80 font-sans">
              <li>
                <Link to="/about" className="hover:text-cosmic-gold transition-colors">
                  About Voxigen
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cosmic-gold transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-cosmic-gold transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cosmic-gold transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Note & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cosmic-lavender/50">
          <p>© {new Date().getFullYear()} Voxigen. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with cosmic reverence <Sparkles className="w-3.5 h-3.5 text-cosmic-gold" /> for Vedic seekers.
          </p>
        </div>
      </div>
    </footer>
  );
};
