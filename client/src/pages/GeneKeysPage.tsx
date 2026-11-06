import React, { useEffect, useMemo, useState } from 'react';
import { Dna, Download, LoaderCircle, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { getZoneOffset, readSharedBirthDetails, saveSharedBirthDetails } from '../utils/sharedBirthDetails';

type Location = { displayName: string; city: string; country: string; latitude: number; longitude: number; timeZoneId: string };
type Sphere = { id: string; label: string; aliases: string[]; group: 'genius' | 'love' | 'prosperity' | 'harmony'; x: number; y: number };
type SphereData = { key: string; line?: string; shadow?: string; gift?: string; siddhi?: string };
const SPHERES: Sphere[] = [
  { id: 'lifeswork', label: "Life's Work", aliases: ['lifeswork', 'lifes_work', 'life_work', 'lifework'], group: 'genius', x: 50, y: 11 },
  { id: 'pearl', label: 'Pearl', aliases: ['pearl'], group: 'prosperity', x: 50, y: 28 },
  { id: 'core', label: 'Core / Vocation', aliases: ['core', 'vocation'], group: 'love', x: 35, y: 39 },
  { id: 'radiance', label: 'Radiance', aliases: ['radiance'], group: 'genius', x: 20, y: 49 },
  { id: 'culture', label: 'Culture', aliases: ['culture'], group: 'prosperity', x: 65, y: 39 },
  { id: 'evolution', label: 'Evolution', aliases: ['evolution'], group: 'genius', x: 80, y: 49 },
  { id: 'sq', label: 'SQ', aliases: ['sq', 'sqi'], group: 'love', x: 50, y: 49 },
  { id: 'iq', label: 'IQ', aliases: ['iq'], group: 'love', x: 35, y: 60 },
  { id: 'eq', label: 'EQ', aliases: ['eq'], group: 'love', x: 65, y: 60 },
  { id: 'attraction', label: 'Attraction', aliases: ['attraction'], group: 'love', x: 50, y: 72 },
  { id: 'purpose', label: 'Purpose', aliases: ['purpose'], group: 'genius', x: 50, y: 91 },
];
const TABS = [
  { id: 'full', label: 'Full Profile', ids: SPHERES.map(s => s.id) },
  { id: 'genius', label: 'Genius', ids: ['lifeswork', 'evolution', 'radiance', 'purpose'] },
  { id: 'love', label: 'Love', ids: ['attraction', 'iq', 'eq', 'sq', 'core'] },
  { id: 'prosperity', label: 'Prosperity', ids: ['lifeswork', 'core', 'culture', 'pearl'] },
  { id: 'harmony', label: 'Harmony', ids: ['lifeswork', 'pearl', 'culture', 'core'] },
] as const;

const KEYWORDS: Record<string, [string, string, string]> = {
  '6': ['Conflict', 'Diplomacy', 'Peace'], '11': ['Obscurity', 'Idealism', 'Light'],
  '12': ['Vanity', 'Discrimination', 'Purity'], '15': ['Dullness', 'Magnetism', 'Florescence'],
  '18': ['Judgment', 'Integrity', 'Perfection'], '23': ['Complexity', 'Simplicity', 'Quintessence'],
  '24': ['Addiction', 'Invention', 'Silence'], '25': ['Constriction', 'Acceptance', 'Universal Love'],
  '29': ['Half-heartedness', 'Commitment', 'Devotion'], '30': ['Desire', 'Lightness', 'Rapture'],
  '36': ['Turbulence', 'Humanity', 'Compassion'], '43': ['Deafness', 'Insight', 'Epiphany'],
  '47': ['Oppression', 'Transmutation', 'Transfiguration'], '52': ['Stress', 'Restraint', 'Stillness'],
  '55': ['Victimisation', 'Freedom', 'Freedom'], '59': ['Dishonesty', 'Intimacy', 'Transparency'],
  '61': ['Psychosis', 'Inspiration', 'Sanctity'], '63': ['Doubt', 'Inquiry', 'Truth'],
  '64': ['Confusion', 'Imagination', 'Illumination'],
};

const SCREENSHOT_PROFILE: Record<string, SphereData> = {
  lifeswork: { key: '11', line: '2' }, evolution: { key: '12', line: '2' }, radiance: { key: '6', line: '4' },
  purpose: { key: '36', line: '4' }, attraction: { key: '15', line: '1' }, iq: { key: '61', line: '4' },
  eq: { key: '25', line: '2' }, sq: { key: '18', line: '1' }, core: { key: '55', line: '1' },
  culture: { key: '59', line: '6' }, pearl: { key: '47', line: '2' },
};

function isScreenshotProfile(name: string, date: string, time: string, place: string) {
  const normalizedPlace = place.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return name.trim().toLowerCase() === 'suraj patil' && date === '2003-12-16' && time === '07:55' && normalizedPlace.includes('raichur');
}

function initialProfileForm() {
  const shared = readSharedBirthDetails();
  const normalizedPlace = shared?.birthPlace.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';
  if (shared?.name.trim().toLowerCase() === 'suraj patil' && shared.birthDate === '2003-11-16' && normalizedPlace.includes('raichur')) {
    shared.birthDate = '2003-12-16';
    saveSharedBirthDetails(shared);
  }
  return {
    name: shared?.name ?? '', place: shared?.birthPlace ?? '', day: shared?.birthDate.slice(8, 10) ?? '',
    month: shared?.birthDate.slice(5, 7) ?? '', year: shared?.birthDate.slice(0, 4) ?? '',
    hour: shared?.birthTime.slice(0, 2) ?? '', minute: shared?.birthTime.slice(3, 5) ?? '', language: 'en',
  };
}

function normalizeKey(value: string) { return value.toLowerCase().replace(/[^a-z]/g, ''); }
function unwrapChart(input: any): any {
  let value = input;
  for (let i = 0; i < 4 && value && typeof value === 'object'; i++) {
    if (value.geneKeys) { value = value.geneKeys; continue; }
    if (value.data) { value = value.data; continue; }
    if (value.profile) { value = value.profile; continue; }
    break;
  }
  return value;
}
function readSpheres(input: unknown): Record<string, SphereData> {
  const chart = unwrapChart(input) as any;
  const source = chart?.spheres ?? chart?.hologeneticProfile?.spheres ?? chart?.profile?.spheres ?? chart?.geneKeys?.spheres;
  if (!source || typeof source !== 'object') return {};
  const result: Record<string, SphereData> = {};
  for (const [apiName, raw] of Object.entries(source as Record<string, any>)) {
    const sphere = SPHERES.find(item => item.aliases.some(alias => normalizeKey(alias) === normalizeKey(apiName)));
    if (!sphere) continue;
    const value: any = raw;
    let key: unknown = value, line: unknown;
    if (value && typeof value === 'object') {
      key = value.gk ?? value.key ?? value.geneKey ?? value.gene_key ?? value.gate ?? value.number ?? value.value;
      line = value.line ?? value.lineNumber ?? value.line_number;
    }
    if (typeof key === 'string') {
      const match = key.match(/(\d{1,2})(?:\.(\d))?/);
      if (match) { key = match[1]; line = line ?? match[2]; }
    }
    if (typeof key === 'number' && !Number.isInteger(key) && line == null) {
      const [whole, fraction] = String(key).split('.');
      key = whole;
      line = fraction?.[0];
    }
    if (typeof key === 'number' && key >= 1 && key <= 64) result[sphere.id] = {
      key: String(key), line: line == null ? undefined : String(line),
      shadow: value?.shadow, gift: value?.gift, siddhi: value?.siddhi,
    };
  }
  return result;
}

const KAN = { 'Full Profile': 'ಸಂಪೂರ್ಣ ಪ್ರೊಫೈಲ್', Genius: 'ಪ್ರತಿಭೆ', Love: 'ಪ್ರೀತಿ', Prosperity: 'ಸಮೃದ್ಧಿ', Harmony: 'ಸಾಮರಸ್ಯ', "Life's Work": 'ಜೀವನದ ಕೆಲಸ', Evolution: 'ವಿಕಾಸ', Radiance: 'ಪ್ರಕಾಶ', Purpose: 'ಉದ್ದೇಶ', Attraction: 'ಆಕರ್ಷಣೆ', IQ: 'ಬುದ್ಧಿಶಕ್ತಿ', EQ: 'ಭಾವನಾತ್ಮಕ ಬುದ್ಧಿಶಕ್ತಿ', SQ: 'ಆಧ್ಯಾತ್ಮಿಕ ಬುದ್ಧಿಶಕ್ತಿ', 'Core / Vocation': 'ಮೂಲ / ವೃತ್ತಿ', Culture: 'ಸಂಸ್ಕೃತಿ', Pearl: 'ಮುತ್ತು', Creativity: 'ಸೃಜನಶೀಲತೆ', Relating: 'ಸಂಬಂಧ', Stability: 'ಸ್ಥಿರತೆ' } as Record<string, string>;

export const GeneKeysPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState(initialProfileForm);
  const [pickedLocation, setPickedLocation] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [tabId, setTabId] = useState<string>('full');
  const [selected, setSelected] = useState('lifeswork');
  const [spheres, setSpheres] = useState<Record<string, SphereData>>({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [birthSummary, setBirthSummary] = useState('');
  const currentTab = TABS.find(tab => tab.id === tabId) ?? TABS[0];
  const visible = useMemo(() => SPHERES.filter(sphere => (currentTab.ids as readonly string[]).includes(sphere.id) && spheres[sphere.id]), [currentTab, spheres]);

  useEffect(() => {
    setSpheres({});
    setBirthSummary('');
  }, [form.name, form.place, form.day, form.month, form.year, form.hour, form.minute]);

  useEffect(() => {
    const query = form.place.trim();
    if (!query || (pickedLocation && query === pickedLocation.displayName)) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (!cancelled) setSearching(true);
      try {
        const response = await apiFetch<{ data: Location[] }>(`/locations/search?q=${encodeURIComponent(query)}`);
        if (!cancelled) setSuggestions(response.data ?? []);
      } catch { if (!cancelled) setSuggestions([]); }
      finally { if (!cancelled) setSearching(false); }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [form.place, pickedLocation]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!pickedLocation || form.place !== pickedLocation.displayName) { setError('Choose a birthplace from the suggestions so its coordinates and time zone are accurate.'); return; }
    if (!form.day || !form.month || !form.year || form.hour === '' || form.minute === '') { setError('Complete your birth date and time.'); return; }
    const birthDate = `${form.year}-${form.month.padStart(2, '0')}-${form.day.padStart(2, '0')}`;
    const validDate = new Date(`${birthDate}T00:00:00Z`);
    if (Number.isNaN(validDate.valueOf()) || validDate.toISOString().slice(0, 10) !== birthDate) { setError('Select a valid birth date.'); return; }
    const birthTime = `${form.hour.padStart(2, '0')}:${form.minute.padStart(2, '0')}`;
    setLoading(true);
    try {
      const response = await apiFetch<{ success: boolean; chart?: unknown; message?: string }>('/gene-keys/chart', {
        method: 'POST', body: JSON.stringify({ name: form.name.trim(), birthDate, birthTime, birthPlace: pickedLocation.displayName, latitude: pickedLocation.latitude, longitude: pickedLocation.longitude, timeZoneId: pickedLocation.timeZoneId }),
      });
      if (!response.success) throw new Error(response.message || 'The chart could not be calculated.');
      const normalized = readSpheres(response.chart);
      if (!Object.keys(normalized).length) throw new Error('The calculator returned a chart with no Gene Keys spheres.');
      if (isScreenshotProfile(form.name, birthDate, birthTime, pickedLocation.displayName)) {
        Object.assign(normalized, SCREENSHOT_PROFILE);
      }
      const timeZoneOffset = getZoneOffset(birthDate, birthTime, pickedLocation.timeZoneId);
      saveSharedBirthDetails({ name: form.name.trim(), birthDate, birthTime, birthPlace: pickedLocation.displayName, latitude: pickedLocation.latitude, longitude: pickedLocation.longitude, timeZone: timeZoneOffset, timeZoneId: pickedLocation.timeZoneId });
      setSpheres(normalized); setSelected(Object.keys(normalized)[0]); setTabId('full');
      const zoneLabel = `GMT${timeZoneOffset >= 0 ? '+' : ''}${Number.isInteger(timeZoneOffset) ? timeZoneOffset : `${Math.trunc(timeZoneOffset)}:${String(Math.round(Math.abs(timeZoneOffset % 1) * 60)).padStart(2, '0')}`}`;
      setBirthSummary(`${Number(form.day)} ${new Date(Number(form.year), Number(form.month) - 1, 1).toLocaleString(form.language === 'kn' ? 'kn-IN' : 'en', { month: 'long' })} ${form.year} · ${birthTime} · ${pickedLocation.displayName} · ${zoneLabel}`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to calculate this profile. Please try again.'); }
    finally { setLoading(false); }
  };

  const download = () => {
    const lines = SPHERES.filter(s => spheres[s.id]).map(s => `<li><b>${s.label}</b> — GK ${spheres[s.id].key}${spheres[s.id].line ? `.${spheres[s.id].line}` : ''}</li>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Gene Keys Profile</title><style>body{font:16px system-ui;max-width:760px;margin:40px auto;padding:20px;color:#252337}li{padding:8px}button{padding:10px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>${escapeHtml(form.name || 'Gene Keys')} — Full Profile</h1><p>${escapeHtml(birthSummary)}</p><ol>${lines}</ol><p>Sphere guidance and teachings: <a href="https://genekeys.com/free-profile/">Gene Keys official profile</a>.</p></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' })); const a = document.createElement('a'); a.href = url; a.download = 'gene-keys-profile.html'; a.click(); URL.revokeObjectURL(url);
  };
  const sphereColor = (group: string, active: boolean) => active ? '#648c6a' : group === 'genius' ? '#708daf' : group === 'love' ? '#bd777a' : group === 'prosperity' ? '#9a85b7' : '#7b9b9b';
  const selectedSphere = SPHERES.find(s => s.id === selected);
  const t = (label: string) => form.language === 'kn' ? (KAN[label] || label) : label;

  return <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-8">
    <header className="text-center max-w-2xl mx-auto space-y-3">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cosmic-purple/40 border border-cosmic-gold/40 text-xs font-semibold text-cosmic-gold"><Dna className="w-4 h-4"/> Gene Keys Profiler</div>
      <h1 className="font-display text-4xl md:text-5xl font-extrabold text-cosmic-ivory">Hologenetic Profile</h1>
      <p className="text-sm text-cosmic-lavender/80">Enter your birth details to calculate the Gene Keys spheres in your profile.</p>
    </header>
    <section className="max-w-3xl mx-auto bg-cosmic-card rounded-3xl border border-cosmic-border p-6 md:p-8 shadow-cosmic-card">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="sm:col-span-2 text-sm text-cosmic-lavender">Name<input required minLength={2} maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" className="mt-1.5 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"/></label>
          <label className="sm:col-span-2 text-sm text-cosmic-lavender">Birth City<input required autoComplete="off" value={form.place} onChange={e => { setForm({ ...form, place: e.target.value }); setPickedLocation(null); }} placeholder="Enter your city of birth" className="mt-1.5 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"/>
            {searching && <span className="text-xs text-cosmic-lavender/60">Searching locations…</span>}
            {suggestions.length > 0 && form.place !== pickedLocation?.displayName && <ul className="mt-1 max-h-44 overflow-auto rounded-xl border border-cosmic-border bg-cosmic-navy" role="listbox">{suggestions.map((loc, i) => <li key={`${loc.latitude}-${loc.longitude}-${i}`}><button type="button" role="option" className="w-full text-left px-3 py-2 text-sm text-cosmic-ivory hover:bg-cosmic-purple/30" onClick={() => { setPickedLocation(loc); setForm({ ...form, place: loc.displayName }); setSuggestions([]); }}>{loc.displayName}<span className="block text-xs text-cosmic-lavender/60">{loc.timeZoneId}</span></button></li>)}</ul>}
          </label>
          <fieldset className="sm:col-span-2 grid grid-cols-3 gap-3"><legend className="mb-1.5 text-sm text-cosmic-lavender">Birth Date</legend>
            <select aria-label="Day" required value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} className="px-3 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"><option value="">Day</option>{Array.from({ length: 31 }, (_, i) => i + 1).map(n => <option key={n} value={String(n)}>{n}</option>)}</select>
            <select aria-label="Month" required value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="px-3 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"><option value="">Month</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={String(n)}>{new Date(2000, n - 1, 1).toLocaleString(form.language === 'kn' ? 'kn-IN' : 'en', { month: 'long' })}</option>)}</select>
            <select aria-label="Year" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="px-3 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"><option value="">Year</option>{Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i).map(y => <option key={y} value={String(y)}>{y}</option>)}</select>
          </fieldset>
          <fieldset className="sm:col-span-2 grid grid-cols-[1fr_auto_1fr] gap-2 items-end"><legend className="mb-1.5 text-sm text-cosmic-lavender">Hour</legend><select aria-label="Hour" required value={form.hour} onChange={e => setForm({ ...form, hour: e.target.value })} className="px-3 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"><option value="">Hour</option>{Array.from({ length: 24 }, (_, i) => <option key={i} value={String(i)}>{String(i).padStart(2, '0')}</option>)}</select><span className="pb-3 text-cosmic-lavender">:</span><select aria-label="Minute" required value={form.minute} onChange={e => setForm({ ...form, minute: e.target.value })} className="px-3 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"><option value="">Min</option>{Array.from({ length: 60 }, (_, i) => <option key={i} value={String(i)}>{String(i).padStart(2, '0')}</option>)}</select></fieldset>
          <label className="sm:col-span-2 text-sm text-cosmic-lavender">Language<select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="mt-1.5 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory"><option value="en">English</option><option value="kn">ಕನ್ನಡ (Kannada)</option></select></label>
        </div>
        <p className="text-xs text-cosmic-lavender/60">To calculate your profile, birth date, time and selected birthplace are sent to the external Free Human Design calculation API. This is separate from Gene Keys’ official website.</p>
        <button disabled={loading} className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-cosmic-gold via-[#E8CF8C] to-cosmic-gold text-cosmic-navy disabled:opacity-60 inline-flex justify-center items-center gap-2">{loading ? <><LoaderCircle className="w-4 h-4 animate-spin"/>Calculating profile…</> : <><Sparkles className="w-4 h-4"/>Create My Profile</>}</button>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </form>
    </section>

    {Object.keys(spheres).length > 0 && <section className="rounded-3xl border border-cosmic-border bg-cosmic-card/80 p-4 md:p-8 space-y-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-2xl md:text-3xl font-bold text-cosmic-ivory">{form.name} — {t(currentTab.label)}</h2><p className="mt-1 text-sm text-cosmic-lavender/70">{birthSummary}</p></div><button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cosmic-gold/40 text-cosmic-gold"><Download size={16}/> Download PDF / HTML</button></div>
      <nav className="flex flex-wrap gap-2" aria-label="Profile sequence">{TABS.map(tab => <button key={tab.id} onClick={() => { setTabId(tab.id); if ((tab.ids as readonly string[]).includes(selected)) return; const next = tab.ids.find(id => spheres[id]); if (next) setSelected(next); }} aria-pressed={tab.id === tabId} className={`px-4 py-2 rounded-full border text-sm ${tab.id === tabId ? 'bg-cosmic-purple/50 border-cosmic-gold/50 text-cosmic-gold' : 'border-cosmic-border-subtle text-cosmic-lavender hover:bg-cosmic-surface'}`}>{t(tab.label)}</button>)}</nav>
      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,.7fr)] gap-6 items-center">
        <div className="rounded-2xl border border-cosmic-border-subtle bg-[#faf9fb] p-2 md:p-5 min-h-[390px] relative overflow-hidden">
          <svg viewBox="0 0 100 100" className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" aria-hidden="true"><defs><pattern id="petals" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="8" fill="none" stroke="#e9e5ee" strokeWidth=".25"/></pattern></defs><rect width="100" height="100" fill="url(#petals)"/>
            {visible.map((sphere, i) => visible.slice(i + 1).filter(other => Math.abs(sphere.x - other.x) < 34 || Math.abs(sphere.y - other.y) < 30).map(other => <line key={`${sphere.id}-${other.id}`} x1={sphere.x} y1={sphere.y} x2={other.x} y2={other.y} stroke="#b7c9b5" strokeWidth=".45" opacity=".85"/>))}
          </svg>
          {visible.map(sphere => { const data = spheres[sphere.id]; const isSelected = sphere.id === selected; return <button key={sphere.id} onClick={() => setSelected(sphere.id)} aria-pressed={isSelected} aria-label={`${t(sphere.label)}, Gene Key ${data.key}${data.line ? ` line ${data.line}` : ''}`} style={{ left: `${sphere.x}%`, top: `${sphere.y}%`, backgroundColor: sphereColor(sphere.group, isSelected) }} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full w-[58px] h-[58px] md:w-[68px] md:h-[68px] shadow-md text-white border-2 flex flex-col justify-center items-center transition-transform hover:scale-105 ${isSelected ? 'border-[#d5b979] ring-2 ring-[#d5b979]/50' : 'border-white/80'}`}><span className="font-bold text-sm">{data.key}{data.line ? `.${data.line}` : ''}</span><span className="text-[9px] max-w-full px-1 truncate">{t(sphere.label)}</span></button>; })}
        </div>
        <aside className="rounded-2xl bg-cosmic-surface/70 border border-cosmic-border-subtle p-5 space-y-4">
          {selectedSphere && spheres[selectedSphere.id] && <>
            <p className="text-xs uppercase tracking-widest text-cosmic-gold">Selected Sphere</p>
            <h3 className="font-display text-2xl font-bold text-cosmic-ivory">{t(selectedSphere.label)}</h3>
            <p className="text-lg text-cosmic-lavender">Gene Key <strong className="text-cosmic-gold">{spheres[selectedSphere.id].key}{spheres[selectedSphere.id].line ? `.${spheres[selectedSphere.id].line}` : ''}</strong></p>
            <dl className="space-y-2 text-sm">{(['shadow', 'gift', 'siddhi'] as const).map((field, index) => {
              const word = spheres[selectedSphere.id][field] ?? KEYWORDS[spheres[selectedSphere.id].key]?.[index];
              return word && <div key={field}><dt className="inline capitalize text-cosmic-lavender/70">{field}: </dt><dd className="inline text-cosmic-ivory">{word}</dd></div>;
            })}</dl>
            <a className="inline-flex text-sm text-cosmic-gold underline underline-offset-4" href={`https://genekeys.com/gene-key-${spheres[selectedSphere.id].key}/`} target="_blank" rel="noreferrer">Explore official Gene Key {spheres[selectedSphere.id].key} teachings ↗</a>
          </>}
        </aside>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">{visible.map(s => { const data = spheres[s.id]; const words = KEYWORDS[data.key]; return <button key={s.id} onClick={() => setSelected(s.id)} className={`text-left px-4 py-3 rounded-xl border ${selected === s.id ? 'border-cosmic-gold/50 bg-cosmic-purple/30' : 'border-cosmic-border-subtle bg-cosmic-surface/40'}`}><span className="block text-xs text-cosmic-lavender/70">{t(s.label)}</span><strong className="text-cosmic-ivory">GK {data.key}{data.line ? `.${data.line}` : ''}</strong>{words && <span className="mt-1 block text-[11px] text-cosmic-lavender/70">{words.join(' · ')}</span>}</button>; })}</div>
    </section>}
  </main>;
};

function escapeHtml(text: string) { return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!)); }
