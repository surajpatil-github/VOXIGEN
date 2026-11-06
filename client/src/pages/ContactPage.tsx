import { MapPin, Phone, Sparkles } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cosmic-purple/40 border border-cosmic-gold/40 text-xs font-semibold text-cosmic-gold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>We’re here to help</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-cosmic-ivory">Contact Voxigen</h1>
        <p className="text-cosmic-lavender/80 max-w-xl mx-auto leading-relaxed">
          Have a question or need assistance? Reach us by phone or visit our office in Bengaluru.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <section className="bg-cosmic-card backdrop-blur-md rounded-3xl border border-cosmic-border p-7 md:p-9 shadow-cosmic-card">
          <div className="w-12 h-12 rounded-2xl bg-cosmic-purple/40 border border-cosmic-gold/30 flex items-center justify-center mb-6">
            <Phone className="w-5 h-5 text-cosmic-gold" />
          </div>
          <h2 className="font-display text-xl font-bold text-cosmic-ivory mb-2">Call us</h2>
          <p className="text-sm text-cosmic-lavender/70 mb-5">We’d be glad to hear from you.</p>
          <a href="tel:8970171999" className="text-lg font-semibold text-cosmic-gold hover:underline underline-offset-4">8970171999</a>
        </section>

        <section className="bg-cosmic-card backdrop-blur-md rounded-3xl border border-cosmic-border p-7 md:p-9 shadow-cosmic-card">
          <div className="w-12 h-12 rounded-2xl bg-cosmic-purple/40 border border-cosmic-gold/30 flex items-center justify-center mb-6">
            <MapPin className="w-5 h-5 text-cosmic-gold" />
          </div>
          <h2 className="font-display text-xl font-bold text-cosmic-ivory mb-2">Visit us</h2>
          <p className="text-sm text-cosmic-lavender/70 mb-5">Our address</p>
          <address className="not-italic leading-relaxed text-cosmic-ivory/90">
            #169/K, 19th main, 1st Block,<br />
            2nd Stage, Rajajinagar,<br />
            Bengaluru-560010
          </address>
        </section>
      </div>
    </div>
  );
};
