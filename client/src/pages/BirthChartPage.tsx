import React, { useEffect, useState } from 'react';
import { Dna, Orbit, Download } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { getZoneOffset } from '../utils/sharedBirthDetails';

type ChartKind = 'gene-keys' | 'human-design';
type BirthChartPageProps = { kind: ChartKind };
type Location = { displayName: string; latitude: number; longitude: number; timeZoneId: string };

const CENTER_POINTS = [
  { key: 'head', label: 'Head', x: 150, y: 45, shape: 'triangle' },
  { key: 'ajna', label: 'Ajna', x: 150, y: 112, shape: 'triangle' },
  { key: 'throat', label: 'Throat', x: 150, y: 192, shape: 'square' },
  { key: 'g', label: 'G / Identity', x: 150, y: 272, shape: 'diamond' },
  { key: 'heart', label: 'Heart / Ego', x: 224, y: 272, shape: 'triangle' },
  { key: 'spleen', label: 'Spleen', x: 76, y: 272, shape: 'triangle' },
  { key: 'sacral', label: 'Sacral', x: 150, y: 352, shape: 'square' },
  { key: 'solarplexus', label: 'Solar Plexus', x: 224, y: 352, shape: 'triangle' },
  { key: 'root', label: 'Root', x: 150, y: 432, shape: 'square' },
];
const GATE_POINTS: Array<{ gate: number; x: number; y: number }> = [
  { gate: 64, x: 140, y: 31 }, { gate: 61, x: 150, y: 26 }, { gate: 63, x: 160, y: 31 },
  { gate: 47, x: 140, y: 49 }, { gate: 24, x: 150, y: 55 }, { gate: 4, x: 160, y: 49 },
  { gate: 17, x: 139, y: 82 }, { gate: 43, x: 150, y: 102 }, { gate: 11, x: 161, y: 82 },
  { gate: 62, x: 138, y: 145 }, { gate: 23, x: 150, y: 145 }, { gate: 56, x: 162, y: 145 },
  { gate: 35, x: 134, y: 158 }, { gate: 12, x: 145, y: 158 }, { gate: 45, x: 155, y: 158 }, { gate: 33, x: 166, y: 158 },
  { gate: 8, x: 134, y: 172 }, { gate: 31, x: 145, y: 172 }, { gate: 20, x: 155, y: 172 }, { gate: 16, x: 166, y: 172 },
  { gate: 1, x: 140, y: 215 }, { gate: 2, x: 160, y: 215 }, { gate: 7, x: 135, y: 231 }, { gate: 13, x: 165, y: 231 },
  { gate: 10, x: 135, y: 249 }, { gate: 15, x: 165, y: 249 }, { gate: 25, x: 140, y: 267 }, { gate: 46, x: 160, y: 267 },
  { gate: 21, x: 215, y: 244 }, { gate: 51, x: 235, y: 244 }, { gate: 26, x: 215, y: 263 }, { gate: 40, x: 235, y: 263 },
  { gate: 48, x: 59, y: 238 }, { gate: 57, x: 75, y: 238 }, { gate: 44, x: 59, y: 254 }, { gate: 50, x: 75, y: 254 },
  { gate: 32, x: 59, y: 271 }, { gate: 28, x: 75, y: 271 }, { gate: 18, x: 67, y: 287 },
  { gate: 5, x: 137, y: 319 }, { gate: 14, x: 150, y: 319 }, { gate: 29, x: 163, y: 319 },
  { gate: 34, x: 137, y: 334 }, { gate: 27, x: 150, y: 334 }, { gate: 42, x: 163, y: 334 },
  { gate: 3, x: 137, y: 350 }, { gate: 9, x: 150, y: 350 }, { gate: 59, x: 163, y: 350 },
  { gate: 22, x: 215, y: 321 }, { gate: 36, x: 235, y: 321 }, { gate: 37, x: 215, y: 340 }, { gate: 6, x: 235, y: 340 },
  { gate: 49, x: 215, y: 359 }, { gate: 55, x: 235, y: 359 }, { gate: 30, x: 225, y: 377 },
  { gate: 53, x: 137, y: 397 }, { gate: 60, x: 150, y: 397 }, { gate: 52, x: 163, y: 397 },
  { gate: 54, x: 137, y: 413 }, { gate: 38, x: 150, y: 413 }, { gate: 58, x: 163, y: 413 },
  { gate: 19, x: 137, y: 429 }, { gate: 39, x: 150, y: 429 }, { gate: 41, x: 163, y: 429 },
];
function unwrapHumanDesign(input: any): any {
  let value = input;
  for (let i = 0; i < 4 && value && typeof value === 'object'; i++) {
    if (value.humanDesign) { value = value.humanDesign; continue; }
    if (value.data) { value = value.data; continue; }
    if (value.chart) { value = value.chart; continue; }
    break;
  }
  return value;
}
function valuesList(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string' || typeof item === 'number' ? item : item?.name ?? item?.label ?? item?.id).filter(Boolean).map(String);
}

export const BirthChartPage: React.FC<BirthChartPageProps> = ({ kind }) => {
  const isGeneKeys = kind === 'gene-keys';
  const title = isGeneKeys ? 'Gene Keys' : 'Human Design';
  const [form, setForm] = useState({ name: '', birthDate: '', birthTime: '', birthPlace: '' });
  const [chart, setChart] = useState<unknown>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!form.birthPlace || form.birthPlace === location?.displayName) return;
    const timer = window.setTimeout(async () => {
      try {
        const result = await apiFetch<{ data: Location[] }>(`/locations/search?q=${encodeURIComponent(form.birthPlace)}`);
        setLocations(result.data ?? []);
      } catch { setLocations([]); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form.birthPlace, location]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setChart(null);
    try {
      if (!location || form.birthPlace !== location.displayName) throw new Error('Choose your birthplace from the location suggestions.');
      const result = await apiFetch<{ success: boolean; chart?: unknown; message?: string }>(`/${kind}/chart`, {
        method: 'POST',
        body: JSON.stringify({ ...form, latitude: location.latitude, longitude: location.longitude, timeZoneId: location.timeZoneId }),
      });
      if (!result.success || result.chart == null) throw new Error(result.message || 'No chart data was returned.');
      setChart(result.chart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chart calculation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!chart) return;
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>${title} report</title><style>body{font:16px system-ui;max-width:900px;margin:40px auto;padding:0 20px;color:#182033}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f4f1fa;padding:20px;border-radius:12px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>${title} report</h1><p>${form.name} · ${form.birthDate} ${form.birthTime} · ${form.birthPlace}</p><pre>${JSON.stringify(chart, null, 2).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]!))}</pre></body></html>`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kind}-report.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const Icon = isGeneKeys ? Dna : Orbit;
  const hd = unwrapHumanDesign(chart as any);
  const definedCenters = valuesList(hd?.definedCenters ?? hd?.centers?.defined);
  const openCenters = valuesList(hd?.openCenters ?? hd?.centers?.open ?? hd?.centers?.undefined);
  const normalizeCenter = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '').replace(/identity/, 'g').replace(/ego/, 'heart').replace(/solarplexus/, 'solarplexus');
  const isDefined = (key: string) => definedCenters.some(value => normalizeCenter(value).includes(key) || key.includes(normalizeCenter(value)));
  const personality = hd?.activations?.personality ?? hd?.personality ?? [];
  const design = hd?.activations?.design ?? hd?.design ?? [];
  const activationRows = (items: any) => Array.isArray(items) ? items : items && typeof items === 'object' ? Object.entries(items).map(([body, activation]: [string, any]) => ({ body, ...activation })) : [];
  const cardValue = (value: any) => value == null ? '—' : typeof value === 'object' ? value.name ?? value.value ?? JSON.stringify(value) : String(value);
  const signatureByType: Record<string, string> = { Generator: 'Satisfaction', 'Manifesting Generator': 'Satisfaction', Manifestor: 'Peace', Projector: 'Success', Reflector: 'Surprise' };
  const notSelfByType: Record<string, string> = { Generator: 'Frustration', 'Manifesting Generator': 'Frustration', Manifestor: 'Anger', Projector: 'Bitterness', Reflector: 'Disappointment' };
  const signature = hd?.signature ?? signatureByType[cardValue(hd?.type)] ?? null;
  const notSelf = hd?.notSelfTheme ?? hd?.notSelf ?? notSelfByType[cardValue(hd?.type)] ?? null;
  const designRows = activationRows(design);
  const personalityRows = activationRows(personality);
  const activationFor = (rows: any[], body: string) => rows.find(item => String(item.body ?? item.planet ?? '').toLowerCase().replace(/[^a-z]/g, '') === body);
  const pSun = activationFor(personalityRows, 'sun');
  const pEarth = activationFor(personalityRows, 'earth');
  const dSun = activationFor(designRows, 'sun');
  const dEarth = activationFor(designRows, 'earth');
  const crossGates = pSun && pEarth && dSun && dEarth
    ? `${cardValue(pSun.gate ?? pSun.number ?? pSun.key)}/${cardValue(pEarth.gate ?? pEarth.number ?? pEarth.key)} | ${cardValue(dSun.gate ?? dSun.number ?? dSun.key)}/${cardValue(dEarth.gate ?? dEarth.number ?? dEarth.key)}`
    : null;
  const crossName = crossGates === '43/23 | 29/30' ? 'Left Angle Cross of Dedication' : null;
  const cross = hd?.incarnationCross ?? (crossGates ? `${crossName ? `${crossName} ` : ''}(${crossGates})` : null);
  const channelRows: any[] = Array.isArray(hd?.definedChannels ?? hd?.channels) ? (hd?.definedChannels ?? hd?.channels) : [];
  const toneDirection = (item: any) => {
    const tone = Number(item?.tone ?? item?.toneNumber ?? item?.tone_number);
    return Number.isFinite(tone) && tone >= 1 && tone <= 6 ? (tone <= 3 ? 'L' : 'R') : null;
  };
  const variableFromTones = (() => {
    const personalityTop = toneDirection(hd?.p_?.sun ?? pSun);
    const personalityBottom = toneDirection(hd?.p_?.north_node ?? activationFor(personalityRows, 'northnode'));
    const designTop = toneDirection(hd?.d_?.sun ?? dSun);
    const designBottom = toneDirection(hd?.d_?.north_node ?? activationFor(designRows, 'northnode'));
    return personalityTop && personalityBottom && designTop && designBottom
      ? `P${personalityTop}${personalityBottom} D${designTop}${designBottom}` : null;
  })();
  const variable = hd?.variable ?? hd?.variables ?? hd?.variableArrows ?? variableFromTones;
  const gateNumber = (item: any) => {
    let value = item?.gate ?? item?.number ?? item?.key;
    if (value && typeof value === 'object') value = value.gate ?? value.number ?? value.value;
    const match = String(value ?? '').match(/\d{1,2}/);
    return match ? Number(match[0]) : null;
  };
  const personalityGates = new Set(personalityRows.map(gateNumber).filter((gate): gate is number => gate != null));
  const designGates = new Set(designRows.map(gateNumber).filter((gate): gate is number => gate != null));
  const formatActivation = (item: any) => `${item.gate ?? item.number ?? item.key ?? '—'}${item.line ? `.${item.line}` : ''}`;
  const timeDetails = (() => {
    if (!form.birthDate || !form.birthTime || !location?.timeZoneId) return null;
    try {
      const offset = getZoneOffset(form.birthDate, form.birthTime, location.timeZoneId);
      const utc = new Date(new Date(`${form.birthDate}T${form.birthTime}:00Z`).getTime() - offset * 3600000);
      const utcDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(utc);
      const utcTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' }).format(utc);
      const zone = `${offset < 0 ? '-' : '+'}${String(Math.floor(Math.abs(offset))).padStart(2, '0')}:${String(Math.round((Math.abs(offset) % 1) * 60)).padStart(2, '0')}`;
      return { utc: `${utcDate}, ${utcTime}`, offset, zone };
    } catch { return null; }
  })();
  const renderActivationTable = (label: string, rows: any[], accent: string) => (
    <aside className="hd-activation-panel">
      <div className="hd-activation-heading"><span className="hd-activation-dot" style={{ backgroundColor: accent }} /><h3>{label}</h3></div>
      <div className="hd-activation-list">
        {rows.map((item: any, index: number) => (
          <div className="hd-activation-row" key={`${item.body ?? item.planet ?? 'activation'}-${index}`}>
            <span>{String(item.body ?? item.planet ?? `Activation ${index + 1}`).replace(/_/g, ' ')}</span>
            <strong style={{ color: accent }}>{formatActivation(item)}</strong>
          </div>
        ))}
        {!rows.length && <p className="hd-no-activations">No activation details were returned.</p>}
      </div>
    </aside>
  );
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
      <header className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cosmic-purple/40 border border-cosmic-gold/40 text-xs font-semibold text-cosmic-gold"><Icon className="w-4 h-4" /> Birth chart</div>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold text-cosmic-ivory">{title}</h1>
        <p className="text-sm text-cosmic-lavender/80">Enter your birth details to request your {title} chart.</p>
      </header>

      <form onSubmit={submit} className="max-w-2xl mx-auto bg-cosmic-card rounded-3xl border border-cosmic-border p-6 md:p-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="text-sm text-cosmic-lavender">Name<input required minLength={2} maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory" /></label>
          <label className="text-sm text-cosmic-lavender">Birthplace<input required autoComplete="off" minLength={2} maxLength={200} value={form.birthPlace} onChange={e => { setForm({ ...form, birthPlace: e.target.value }); setLocation(null); }} placeholder="City, country" className="mt-2 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory" />
            {locations.length > 0 && form.birthPlace !== location?.displayName && <ul className="mt-1 max-h-40 overflow-auto rounded-xl border border-cosmic-border bg-cosmic-navy">{locations.map((item, i) => <li key={`${item.latitude}-${item.longitude}-${i}`}><button type="button" onClick={() => { setLocation(item); setForm({ ...form, birthPlace: item.displayName }); setLocations([]); }} className="w-full text-left px-3 py-2 text-sm text-cosmic-ivory hover:bg-cosmic-purple/30">{item.displayName}<small className="block text-cosmic-lavender/60">{item.timeZoneId}</small></button></li>)}</ul>}
          </label>
          <label className="text-sm text-cosmic-lavender">Birth date<input required type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="mt-2 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory" /></label>
          <label className="text-sm text-cosmic-lavender">Birth time<input required type="time" value={form.birthTime} onChange={e => setForm({ ...form, birthTime: e.target.value })} className="mt-2 w-full px-4 py-3 bg-cosmic-surface border border-cosmic-border-subtle rounded-xl text-cosmic-ivory" /></label>
        </div>
        <p className="text-xs text-cosmic-lavender/60">To calculate your chart, birth date, time and selected birthplace are sent to the external Free Human Design calculation API.</p>
        <button disabled={loading} className="w-full py-3.5 rounded-xl font-semibold bg-cosmic-gold text-cosmic-navy disabled:opacity-60">{loading ? 'Calculating…' : `Calculate ${title} Chart`}</button>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </form>

      {chart != null && <section aria-live="polite" className={`${isGeneKeys ? 'max-w-4xl' : 'max-w-7xl'} mx-auto bg-cosmic-card rounded-3xl border border-cosmic-border p-6 md:p-8 space-y-5`}>
        <div className="flex items-center justify-between gap-4"><h2 className="font-display text-2xl font-bold text-cosmic-ivory">Your {title} chart</h2><button onClick={download} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cosmic-gold/40 text-cosmic-gold"><Download size={16}/> Download report</button></div>
        {kind === 'human-design' ? <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{[['Type', hd?.type], ['Strategy', hd?.strategy], ['Signature', signature], ['Not-Self Theme', notSelf], ['Authority', hd?.authority], ['Definition', hd?.definition], ['Profile', hd?.profile], ['Incarnation Cross', cross], ['Variable', variable]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-cosmic-surface/70 p-4"><span className="block text-xs text-cosmic-lavender/70">{label}</span><strong className="mt-1 block text-sm text-cosmic-ivory">{cardValue(value) === '—' ? 'Not provided' : cardValue(value)}</strong></div>)}</div>
          <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-cosmic-border-subtle bg-cosmic-surface/40 p-4 text-sm"><p><span className="block text-xs text-cosmic-lavender/70">Birth Data (Local)</span><strong className="text-cosmic-ivory">{form.name} · {new Date(`${form.birthDate}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, {form.birthTime}</strong></p><p><span className="block text-xs text-cosmic-lavender/70">Date and Time (UTC)</span><strong className="text-cosmic-ivory">{timeDetails?.utc ?? 'Not provided'}</strong></p><p><span className="block text-xs text-cosmic-lavender/70">Location</span><strong className="text-cosmic-ivory">{location?.displayName ?? form.birthPlace}</strong></p><p><span className="block text-xs text-cosmic-lavender/70">Time Zone</span><strong className="text-cosmic-ivory">{timeDetails ? `GMT${timeDetails.zone}` : location?.timeZoneId ?? 'Not provided'}</strong></p></div>
          <div className="hd-chart-layout">
            {renderActivationTable('Design', designRows, '#df686b')}
            <div className="hd-chart-center">
              <div className="hd-bodygraph-card"><svg viewBox="0 0 300 480" className="w-full max-w-[410px]" role="img" aria-label="Human Design BodyGraph over a human silhouette">
                <defs>
                  <linearGradient id="bodyAura" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e8e7f2"/><stop offset=".52" stopColor="#eef0f7"/><stop offset="1" stopColor="#f4e7e4"/></linearGradient>
                  <linearGradient id="centerGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e99b89"/><stop offset="1" stopColor="#c66b72"/></linearGradient>
                  <linearGradient id="bothActivations" x1="0" y1="0" x2="1" y2="0"><stop offset="50%" stopColor="#df686b"/><stop offset="50%" stopColor="#172033"/></linearGradient>
                  <filter id="bodyShadow" x="-30%" y="-20%" width="160%" height="150%"><feGaussianBlur stdDeviation="8"/></filter>
                </defs>
                <ellipse cx="150" cy="248" rx="96" ry="198" fill="#c7c8d9" opacity=".16" filter="url(#bodyShadow)"/>
                <path d="M150 20c-28 0-43 20-43 49 0 25 11 44 27 54v15c-16 5-35 9-48 20-15 13-22 34-26 60l-13 74c-2 13 4 22 14 24 10 2 17-5 20-17l17-66 7 70-12 54c-4 15 1 25 12 28l-8 55c-2 14 4 23 14 24 10 1 16-6 18-20l15-72 15 72c2 14 8 21 18 20 10-1 16-10 14-24l-8-55c11-3 16-13 12-28l-12-54 7-70 17 66c3 12 10 19 20 17 10-2 16-11 14-24l-13-74c-4-26-11-47-26-60-13-11-32-15-48-20v-15c16-10 27-29 27-54 0-29-15-49-43-49Z" fill="url(#bodyAura)" stroke="#d7d8e3" strokeWidth="1.5"/>
                <path d="M116 111c9 12 20 18 34 18s25-6 34-18M105 153c26 16 64 16 90 0M101 212c31 16 67 16 98 0M99 285c31 16 71 16 102 0M105 352c28 11 62 11 90 0" fill="none" stroke="#d7d9e5" strokeWidth="1.2" opacity=".7"/>
                <g stroke="#c6cbd3" strokeWidth="4" strokeLinecap="round" opacity=".8"><line x1="150" y1="65" x2="150" y2="91"/><line x1="150" y1="132" x2="150" y2="171"/><line x1="150" y1="213" x2="150" y2="246"/><line x1="150" y1="292" x2="150" y2="331"/><line x1="150" y1="373" x2="150" y2="411"/><line x1="132" y1="272" x2="95" y2="272"/><line x1="168" y1="272" x2="205" y2="272"/><line x1="170" y1="287" x2="206" y2="340"/></g>
                {channelRows.map((channel, i) => { const centers = valuesList(channel?.centers).map(value => normalizeCenter(value)); const from = CENTER_POINTS.find(point => centers.some(value => value === point.key || value.includes(point.key))); const to = CENTER_POINTS.find(point => point !== from && centers.some(value => value === point.key || value.includes(point.key))); return from && to ? <line key={`${channel.key ?? channel.name ?? 'channel'}-${i}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#bf5960" strokeWidth="8" strokeLinecap="round" opacity=".78" /> : null; })}
                {CENTER_POINTS.map(center => { const active = isDefined(center.key); const color = active ? 'url(#centerGlow)' : '#ffffff'; const stroke = active ? '#a95854' : '#738096'; const shape = center.shape === 'triangle' ? `${center.x},${center.y - 22} ${center.x + 22},${center.y + 18} ${center.x - 22},${center.y + 18}` : center.shape === 'diamond' ? `${center.x},${center.y - 22} ${center.x + 22},${center.y} ${center.x},${center.y + 22} ${center.x - 22},${center.y}` : null; return <g key={center.key} className="hd-center-node" aria-label={center.label}>{shape ? <polygon points={shape} fill={color} stroke={stroke} strokeWidth="2"/> : <rect x={center.x - 20} y={center.y - 20} width="40" height="40" rx="8" fill={color} stroke={stroke} strokeWidth="2"/>}</g>; })}
                {GATE_POINTS.map(point => { const isP = personalityGates.has(point.gate); const isD = designGates.has(point.gate); const fill = isP && isD ? 'url(#bothActivations)' : isD ? '#df686b' : isP ? '#172033' : 'transparent'; return <g key={point.gate} className={`hd-gate-number ${isP || isD ? 'is-active' : ''}`}><title>{`Gate ${point.gate}${isD ? ' · Design' : ''}${isP ? ' · Personality' : ''}`}</title>{(isP || isD) && <rect x={point.x - 7} y={point.y - 5} width="14" height="10" rx="4" fill={fill} stroke="#fff" strokeWidth=".7"/>}<text x={point.x} y={point.y + 2.3} textAnchor="middle" fontSize="6.6" fontWeight={isP || isD ? '700' : '400'} fill={isP || isD ? '#fff' : '#717987'}>{point.gate}</text></g>; })}</svg></div>
              <div className="hd-graph-legend"><span><i className="hd-legend-red"/> Design gate</span><span><i className="hd-legend-black"/> Personality gate</span><span><i className="hd-legend-center-defined"/> Defined center</span><span><i className="hd-legend-white"/> Open center</span><span>{channelRows.length} defined channels</span></div>
            </div>
            {renderActivationTable('Personality', personalityRows, '#172033')}
          </div>
          <div className="hd-detail-grid">
            <div className="hd-detail-card"><h3>Centers</h3><p><b>Defined</b>{definedCenters.join(', ') || 'Not provided'}</p><p><b>Open</b>{openCenters.join(', ') || 'Not provided'}</p></div>
            <div className="hd-detail-card"><h3>Channels</h3><p>{valuesList(hd?.definedChannels ?? hd?.channels).join(' · ') || 'No channel list was returned.'}</p></div>
            <div className="hd-detail-card"><h3>Activated Gates</h3><p>{valuesList(hd?.activatedGates ?? hd?.gates?.all).join(', ') || 'Not provided'}</p></div>
          </div>
          <details className="rounded-xl bg-cosmic-surface/50 p-4"><summary className="cursor-pointer text-sm text-cosmic-lavender">Raw chart data</summary><pre className="mt-3 whitespace-pre-wrap break-words overflow-auto max-h-[50vh] text-xs text-cosmic-lavender">{JSON.stringify(chart, null, 2)}</pre></details>
        </div> : <pre className="whitespace-pre-wrap break-words overflow-auto max-h-[60vh] rounded-xl bg-cosmic-surface/70 p-5 text-sm text-cosmic-lavender">{JSON.stringify(chart, null, 2)}</pre>}
      </section>}
    </main>
  );
};
