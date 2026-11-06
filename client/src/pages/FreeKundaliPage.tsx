import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Compass, ShieldCheck, Clock3, Sparkles } from 'lucide-react';
import { BirthForm } from '../components/BirthForm';

export const FreeKundaliPage: React.FC = () => (
  <div className="hd-page landing-page free-kundali-page">
    <main>
      <section className="hd-hero landing-hero free-kundali-hero">
        <div className="hd-orbit hd-orbit-one" /><div className="hd-orbit hd-orbit-two" />
        <div className="hd-copy">
          <Link to="/" className="landing-back"><ArrowLeft size={15} /> Back to home</Link>
          <p className="hd-eyebrow"><i /> YOUR PERSONAL VEDIC BIRTH CHART</p>
          <h1>Discover your<br /><em>Janam Kundali.</em></h1>
          <p className="hd-lede">A map of the sky at the moment you were born. Enter your birth details to explore your Lagna, planetary placements, divisional charts, and Vimshottari Dasha.</p>
          <div className="landing-benefits">
            <span><Check size={15} /> Lahiri sidereal calculations</span>
            <span><Check size={15} /> North, South, and East chart styles</span>
            <span><Check size={15} /> Downloadable chart report</span>
          </div>
          <div className="hd-proof"><span><b><Clock3 size={14} /></b> Takes about a minute</span><span><b><ShieldCheck size={14} /></b> Private by design</span></div>
        </div>
        <div className="landing-form-card">
          <div className="landing-form-intro"><span><Compass size={14} /> FREE VEDIC CHART</span><h2>Your chart begins here</h2><p>Use your birth record for the most accurate result.</p></div>
          <BirthForm buttonText="Calculate my free Kundali" />
        </div>
      </section>

      <section className="landing-intro kundali-guide">
        <p className="hd-eyebrow">A MAP OF YOUR BIRTH SKY</p>
        <h2>Understand the<br /><em>parts of your chart.</em></h2>
        <p className="landing-intro-copy">Your Janam Kundali brings together planetary positions and traditional Vedic interpretations for the time and place of your birth.</p>
        <div className="landing-cards kundali-cards">
          <article><span className="landing-card-number">01</span><Sparkles size={22} className="landing-card-icon" /><h3>Lagna & houses</h3><p>Your ascendant and the twelve houses offer a framework for reading different areas of life.</p></article>
          <article><span className="landing-card-number">02</span><Compass size={22} className="landing-card-icon" /><h3>Planetary positions</h3><p>See each graha’s sign, degree, nakshatra, and placement in your birth chart.</p></article>
          <article><span className="landing-card-number">03</span><Clock3 size={22} className="landing-card-icon" /><h3>Dashas & vargas</h3><p>Explore the Vimshottari timeline and divisional charts including D9 Navamsa.</p></article>
        </div>
      </section>
    </main>
  </div>
);

export default FreeKundaliPage;
