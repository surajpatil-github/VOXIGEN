import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Menu, X, Search } from 'lucide-react';
import { navLinks } from '../data/navigation';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="site-navbar sticky top-0 z-40 w-full bg-cosmic-navy/85 backdrop-blur-xl border-b border-cosmic-border-subtle transition-all">
      <div className="site-navbar-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="site-brand-mark" aria-hidden="true">
            <span>ॐ</span>
          </div>
          <span className="site-brand-title font-display text-2xl font-bold tracking-wider text-cosmic-ivory flex items-center gap-1">VOXIGEN</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map(link => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`site-nav-link px-3.5 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all ${active ? 'is-active' : ''} ${
                  active
                    ? 'text-cosmic-gold bg-cosmic-purple/30 border border-cosmic-gold/30 shadow-sm'
                    : 'text-cosmic-lavender/80 hover:text-cosmic-ivory hover:bg-cosmic-surface/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="hidden lg:flex items-center gap-3">
          <label className="site-search"><Search size={15}/><input aria-label="Search" placeholder="Search" /></label>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="lg:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="site-mobile-toggle p-2 rounded-xl text-cosmic-lavender hover:text-cosmic-ivory hover:bg-cosmic-surface/60 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="site-mobile-menu lg:hidden bg-cosmic-navy/95 border-b border-cosmic-border px-4 pt-3 pb-6 space-y-2 animate-fadeIn backdrop-blur-2xl">
          {navLinks.map(link => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`site-mobile-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cosmic-purple/40 text-cosmic-gold border border-cosmic-gold/40'
                    : 'text-cosmic-lavender hover:bg-cosmic-surface/50 hover:text-cosmic-ivory'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4 text-cosmic-gold" />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3">
            <Link
              to="/free-kundali"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl font-semibold text-center text-sm bg-cosmic-gold text-cosmic-navy flex items-center justify-center gap-2 shadow-gold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Kundali</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
