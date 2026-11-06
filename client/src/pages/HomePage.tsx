import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Heart, Mic2 } from 'lucide-react';

const features = [
  { icon: Mic2, title: 'Voice Analysis', copy: 'Discover the patterns and qualities carried in your voice.', to: '/voice' },
  { icon: Compass, title: 'Kundali', copy: 'Explore your Vedic birth chart and personal cosmic blueprint.', to: '/free-kundali' },
  { icon: Heart, title: 'Matching', copy: 'Find a deeper understanding of connection and compatibility.', to: '/compatibility' },
];

export const HomePage: React.FC = () => (
  <div className="vox-home">
    <section className="vox-hero">
      <div className="vox-stars" aria-hidden="true" />
      <div className="vox-mandala" aria-hidden="true">
        <svg viewBox="0 0 220 220"><circle cx="110" cy="110" r="101"/><circle cx="110" cy="110" r="84"/><circle cx="110" cy="110" r="66"/><path d="M110 20 127 92 200 110 127 128 110 200 93 128 20 110 93 92Z"/><path d="m45 45 18 18m112-18-18 18m18 94-18-18m-112 18 18-18"/><text x="110" y="126" textAnchor="middle">ॐ</text></svg>
      </div>
      <h1>VOXIGEN</h1>
      <p className="vox-tagline">YOUR VOICE. YOUR CODE. YOUR DESTINY.</p>
      <div className="vox-divider" />
      <p className="vox-categories">WELLNESS <i>·</i> VOICE ANALYSIS <i>·</i> ASTROLOGICAL SOLUTIONS</p>
      <p className="vox-powered">POWERED BY YOUR VOICE</p>
      <div className="vox-feature-grid">
        {features.map(({ icon: Icon, title, copy, to }) => <Link className="vox-feature" to={to} key={title}>
          <span className="vox-feature-icon"><Icon size={27} strokeWidth={1.4} /></span>
          <h2>{title}</h2><p>{copy}</p><span className="vox-feature-link">Explore <ArrowRight size={14} /></span>
        </Link>)}
      </div>
    </section>
  </div>
);

export default HomePage;
