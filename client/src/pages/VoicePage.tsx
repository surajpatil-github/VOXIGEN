import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload } from 'lucide-react';
import { apiFetch } from '../utils/api';

type ReportSection = { title: string; content: string };
type MusicalFrame = { time: number; note: string; midi: number; frequency: number };
type SpectralBand = { label: string; range: string; relativePower: number };

const SPECTRAL_BANDS = [
  { label: 'Sub', min: 0, max: 100, range: '0–100 Hz' },
  { label: 'Low', min: 100, max: 250, range: '100–250 Hz' },
  { label: 'Mid', min: 250, max: 1000, range: '250–1,000 Hz' },
  { label: 'High', min: 1000, max: 4000, range: '1,000–4,000 Hz' },
  { label: 'Presence', min: 4000, max: 8000, range: '4,000–8,000 Hz' },
];

async function analyzeAudioSpectrum(file: Blob): Promise<SpectralBand[]> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) throw new Error('Audio analysis is not supported by this browser.');
  const context: AudioContext = new AudioContextClass();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    const samples = buffer.getChannelData(0);
    const size = 4096, hop = size / 2;
    const real = new Float64Array(size), imag = new Float64Array(size);
    const power = new Float64Array(size / 2 + 1);
    let frameCount = 0;
    for (let start = 0; start + size <= samples.length; start += hop) {
      for (let i = 0; i < size; i++) {
        real[i] = samples[start + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1)));
        imag[i] = 0;
      }
      for (let i = 1, j = 0; i < size; i++) {
        let bit = size >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
          [real[i], real[j]] = [real[j], real[i]];
          [imag[i], imag[j]] = [imag[j], imag[i]];
        }
      }
      for (let length = 2; length <= size; length <<= 1) {
        const angle = -2 * Math.PI / length;
        const stepReal = Math.cos(angle), stepImag = Math.sin(angle);
        for (let offset = 0; offset < size; offset += length) {
          let twiddleReal = 1, twiddleImag = 0;
          for (let k = 0; k < length / 2; k++) {
            const even = offset + k, odd = even + length / 2;
            const oddReal = real[odd] * twiddleReal - imag[odd] * twiddleImag;
            const oddImag = real[odd] * twiddleImag + imag[odd] * twiddleReal;
            real[odd] = real[even] - oddReal; imag[odd] = imag[even] - oddImag;
            real[even] += oddReal; imag[even] += oddImag;
            [twiddleReal, twiddleImag] = [twiddleReal * stepReal - twiddleImag * stepImag, twiddleReal * stepImag + twiddleImag * stepReal];
          }
        }
      }
      for (let bin = 0; bin < power.length; bin++) power[bin] += real[bin] ** 2 + imag[bin] ** 2;
      frameCount++;
    }
    if (!frameCount) return [];
    const totalPower = power.reduce((sum, value) => sum + value, 0);
    return SPECTRAL_BANDS.map(band => {
      const firstBin = Math.ceil(band.min * size / buffer.sampleRate);
      const lastBin = Math.min(power.length - 1, Math.floor(band.max * size / buffer.sampleRate));
      let bandPower = 0;
      for (let bin = firstBin; bin <= lastBin; bin++) bandPower += power[bin];
      return { ...band, relativePower: totalPower ? bandPower / totalPower * 100 : 0 };
    });
  } finally { await context.close(); }
}
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

async function analyzeMusicalGrid(file: Blob): Promise<MusicalFrame[]> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) throw new Error('Musical analysis is not supported by this browser.');
  const context: AudioContext = new AudioContextClass();
  try {
    const buffer = await context.decodeAudioData(await file.arrayBuffer());
    const samples = buffer.getChannelData(0);
    const frameSize = 4096;
    const hop = 2048;
    const frames: MusicalFrame[] = [];
    for (let start = 0; start + frameSize < samples.length && frames.length < 120; start += hop) {
      const frame = samples.subarray(start, start + frameSize);
      let energy = 0;
      for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
      if (energy / frame.length < 0.000015) continue;
      let bestLag = 0, best = 0;
      const minLag = Math.floor(context.sampleRate / 1000);
      const maxLag = Math.min(Math.floor(context.sampleRate / 65), frameSize / 2);
      for (let lag = minLag; lag <= maxLag; lag++) {
        let correlation = 0;
        for (let i = 0; i < frameSize - lag; i += 2) correlation += frame[i] * frame[i + lag];
        if (correlation > best) { best = correlation; bestLag = lag; }
      }
      const frequency = bestLag ? context.sampleRate / bestLag : 0;
      if (frequency < 65 || frequency > 1000 || best / energy < 0.12) continue;
      const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
      frames.push({ time: start / context.sampleRate, midi, frequency, note: `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}` });
    }
    return frames;
  } finally { await context.close(); }
}

const sectionAliases: Record<string, string[]> = {
  'Voice observations': ['voiceOverview', 'voice_overview', 'voiceObservations', 'voice_observations', 'summary', 'overview'],
  'Health & wellness': ['health', 'wellness', 'healthWellness', 'healthCondition', 'health_condition', 'vocalHealth'],
  'Astrology-inspired reading': ['astrologyReading', 'astrology_reading', 'astrology', 'astrological', 'cosmicInsights', 'cosmic_insights'],
  Personality: ['personality', 'traits', 'personalityInsights', 'personality_insights'],
};

function formatContent(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? `• ${item}` : JSON.stringify(item)).join('\n');
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${key.replace(/[_-]/g, ' ')}: ${formatContent(item)}`).join('\n');
  return String(value);
}

function getReportSections(analysis: unknown): ReportSection[] {
  const data = (analysis && typeof analysis === 'object' ? analysis : {}) as Record<string, unknown>;
  const sections = Object.entries(sectionAliases).map(([title, aliases]) => {
    const key = aliases.find(alias => data[alias] != null);
    return { title, content: key ? formatContent(data[key]) : '' };
  }).filter(section => section.content);
  const overview = data.report ?? (typeof analysis === 'string' ? analysis : null);
  if (overview && !sections.some(section => section.content === formatContent(overview))) {
    sections.unshift({ title: 'Voice overview', content: formatContent(overview) });
  }
  if (!sections.length && analysis != null) sections.push({ title: 'Analysis report', content: formatContent(analysis) });
  return sections;
}

export const VoicePage: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [audioAnalyzed, setAudioAnalyzed] = useState(false);
  const [musicalGrid, setMusicalGrid] = useState<MusicalFrame[]>([]);
  const [pitchFormat, setPitchFormat] = useState<'grid' | 'table'>('table');
  const [spectralBands, setSpectralBands] = useState<SpectralBand[]>([]);
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const minMidi = musicalGrid.length ? Math.min(...musicalGrid.map(frame => frame.midi)) : 0;
  const maxMidi = musicalGrid.length ? Math.max(...musicalGrid.map(frame => frame.midi)) : 0;
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => () => stream.current?.getTracks().forEach(track => track.stop()), []);
  useEffect(() => {
    if (!audioFile) { setAudioUrl(''); return; }
    const url = URL.createObjectURL(audioFile);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioFile]);

  const send = async (source: File | Blob = audioFile as File | Blob) => {
    if (!source) return;
    setError(''); setAnalysis(null); setMusicalGrid([]); setSpectralBands([]); setAudioAnalyzed(false); setBusy(true);
    try {
      setSpectralBands(await analyzeAudioSpectrum(source));
      const grid = await analyzeMusicalGrid(source);
      setMusicalGrid(grid);
      setAudioAnalyzed(true);
      const audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(new Error('Could not read the audio file.'));
        reader.readAsDataURL(source);
      });
      const result = await apiFetch<{ analysis: unknown }>('/voice/analyze', {
        method: 'POST', body: JSON.stringify({
          audio,
          mimeType: source.type || 'application/octet-stream',
          musicalGrid: grid,
          reportSections: ['musical grid', 'voice observations', 'astrology-inspired voice reading', 'personality reflection'],
          instructions: 'Return a concise JSON report with voiceOverview, musicalGrid, astrologyReading, and personality fields. Use the supplied musicalGrid notes as measured pitch observations; describe note range, most frequent notes, and how pitch moves over time. Do not infer a definitive key or musical skill from speech. If there are too few voiced frames, state that clearly. The astrologyReading should be a warm symbolic reading inspired by audible qualities; do not claim a birth chart, zodiac sign, planetary placement, or destiny can be identified from voice. Label it entertainment and self-reflection. Base acoustic observations only on audible evidence and do not diagnose health conditions.'
        })
      });
      setAnalysis(result.analysis);
    } catch (e) { setError(e instanceof Error ? e.message : 'Voice analysis failed.'); }
    finally { setBusy(false); }
  };

  const start = async () => {
    setError('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      recorder.current = new MediaRecorder(stream.current);
      recorder.current.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      recorder.current.onstop = () => {
        stream.current?.getTracks().forEach(track => track.stop());
        const recordingFile = new Blob(chunks.current, { type: recorder.current?.mimeType || 'audio/webm' });
        setAudioFile(recordingFile);
        setAnalysis(null);
        void send(recordingFile);
      };
      recorder.current.start(); setRecording(true); setAudioFile(null); setAnalysis(null);
    } catch { setError('Microphone access is unavailable. Check browser permission and try again.'); }
  };

  const stop = () => { recorder.current?.stop(); setRecording(false); };
  const upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setAudioFile(file); setAnalysis(null); setMusicalGrid([]); setSpectralBands([]); setAudioAnalyzed(false); setError(''); }
    event.target.value = '';
  };

  return <section className="voice-page"><div className="voice-card">
    <span className="voice-eyebrow">VOXIGEN · VOICE INSIGHTS</span>
    <h1>Listen to your voice</h1>
    <p>Record a short sample or upload audio for voice observations and an astrology-inspired reading based on its sound.</p>
    <div className="voice-actions">
      <button type="button" onClick={recording ? stop : start} disabled={busy} className="voice-record">
        {recording ? <Square size={18}/> : <Mic size={18}/>} {recording ? 'Stop recording' : 'Record your voice'}
      </button>
      <label className="voice-upload"><Upload size={17}/> Upload audio
        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.aiff,.wma" onChange={upload} disabled={busy || recording}/>
      </label>
    </div>
    {recording && <p className="voice-status">Recording… select Stop recording when you’re done.</p>}
    {busy && <p className="voice-status">Sending audio for analysis…</p>}
    {error && <p role="alert" className="voice-error">{error}</p>}
    {audioFile && audioUrl && <div className="voice-track">
      <h2>{audioFile instanceof File ? audioFile.name : 'Your recording'}</h2>
      <audio controls preload="metadata" src={audioUrl}>Your browser does not support audio playback.</audio>
      {!analysis && !busy && <button type="button" className="voice-record" onClick={() => void send()} disabled={busy}>Analyze audio</button>}
    </div>}
    {(analysis || audioAnalyzed) && <div className="voice-result"><h2>Your voice report</h2>
      {analysis && <div className="voice-report-grid">{getReportSections(analysis).map(section => <article className="voice-report-section" key={section.title}>
        <h3>{section.title}</h3><p>{section.content}</p>
      </article>)}</div>}
      <article className="voice-musical-report"><div><h3>Musical pitch grid</h3><p>{musicalGrid.length ? `${musicalGrid.length} voiced frames · ${NOTE_NAMES[((minMidi % 12) + 12) % 12]}${Math.floor(minMidi / 12) - 1}–${NOTE_NAMES[((maxMidi % 12) + 12) % 12]}${Math.floor(maxMidi / 12) - 1} pitch range · ${new Set(musicalGrid.map(frame => frame.note)).size} distinct notes` : 'No clear voiced pitch frames detected. Try a longer, steady spoken or sung sample.'}</p></div>
        {musicalGrid.length > 0 && <div className="voice-pitch-format" role="group" aria-label="Pitch report format">
          <button type="button" aria-pressed={pitchFormat === 'table'} onClick={() => setPitchFormat('table')}>Table</button>
          <button type="button" aria-pressed={pitchFormat === 'grid'} onClick={() => setPitchFormat('grid')}>Pitch grid</button>
        </div>}
        {musicalGrid.length > 0 && pitchFormat === 'grid' && <div className="voice-grid" role="img" aria-label={`Pitch over time: ${musicalGrid.map(frame => frame.note).join(', ')}`}>
          {musicalGrid.map((frame, index) => { const row = maxMidi === minMidi ? 12 : 24 - Math.round((frame.midi - minMidi) / (maxMidi - minMidi) * 23); return <div className="voice-grid-cell" key={`${index}-${frame.time}`} title={`${frame.note} at ${frame.time.toFixed(1)} seconds`} style={{ gridRow: row, gridColumn: index + 1 }}><span>{frame.note}</span></div>; })}
        </div>}
        {musicalGrid.length > 0 && pitchFormat === 'grid' && <div className="voice-grid-axis"><span>Lower pitch</span><span>Time →</span><span>Higher pitch</span></div>}
        {musicalGrid.length > 0 && pitchFormat === 'table' && <div className="voice-pitch-table-wrap"><table className="voice-pitch-table"><thead><tr><th scope="col">Time (s)</th><th scope="col">Note</th><th scope="col">MIDI</th><th scope="col">Frequency (Hz)</th></tr></thead><tbody>
          {musicalGrid.map((frame, index) => <tr key={`${index}-${frame.time}`}><td>{frame.time.toFixed(2)}</td><td>{frame.note}</td><td>{frame.midi}</td><td>{frame.frequency.toFixed(1)}</td></tr>)}
        </tbody></table></div>}
      </article>
      <article className="voice-musical-report"><h3>Frequency report</h3>
        {musicalGrid.length ? <><p>Estimated fundamental pitch from voiced frames. Speech moves between notes; this is not full music transcription.</p><div className="voice-report-grid">
          <section className="voice-report-section"><h3>Pitch range</h3><p>{Math.min(...musicalGrid.map(frame => frame.frequency)).toFixed(1)}–{Math.max(...musicalGrid.map(frame => frame.frequency)).toFixed(1)} Hz</p></section>
          <section className="voice-report-section"><h3>Average pitch</h3><p>{(musicalGrid.reduce((sum, frame) => sum + frame.frequency, 0) / musicalGrid.length).toFixed(1)} Hz</p></section>
          <section className="voice-report-section"><h3>Frequent notes</h3><p>{Object.entries(musicalGrid.reduce((counts, frame) => { counts[frame.note] = (counts[frame.note] || 0) + 1; return counts; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([note, count]) => `${note}: ${count} frames`).join('\n')}</p></section>
        </div></> : <p>No stable pitch frequencies were detected.</p>}
      </article>
      <article className="voice-musical-report"><h3>Relative spectral power</h3>
        <p>FFT power averaged across the audio, shown as each band’s share of measured power.</p>
        {spectralBands.length ? <div className="voice-spectrum" role="img" aria-label={`Relative spectral power: ${spectralBands.map(band => `${band.label} ${band.relativePower.toFixed(1)} percent`).join(', ')}`}>
          {spectralBands.map(band => <div className="voice-spectrum-row" key={band.label}>
            <span className="voice-spectrum-label">{band.label}<small>{band.range}</small></span>
            <div className="voice-spectrum-track"><div className="voice-spectrum-fill" style={{ width: `${Math.min(100, band.relativePower)}%` }} /></div>
            <strong>{band.relativePower.toFixed(1)}%</strong>
          </div>)}
        </div> : <p>Audio is too short for a frequency spectrum estimate.</p>}
      </article>
      <p>The astrology-inspired reading uses voice as a creative prompt; it does not identify a birth chart or zodiac sign. Voice alone cannot diagnose health conditions.</p>
    </div>}
    <p className="voice-note">Your recording is sent to the configured analysis service. Health observations are not a medical diagnosis, and astrology insights are for entertainment.</p>
  </div></section>;
};
