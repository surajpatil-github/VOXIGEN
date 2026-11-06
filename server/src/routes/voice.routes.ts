import { Router } from 'express';
import { z } from 'zod';
import { humanDesignLimiter } from '../middleware/rateLimiter';

const router = Router();
const musicalFrame = z.object({
  time: z.number().finite().min(0),
  note: z.string().max(8),
  midi: z.number().int().min(0).max(127)
});
const recording = z.object({
  audio: z.string().min(100).max(2_500_000),
  mimeType: z.string().max(100),
  musicalGrid: z.array(musicalFrame).max(120).optional(),
  reportSections: z.array(z.string()).max(6).optional(),
  instructions: z.string().max(1500).optional()
});

router.post('/analyze', humanDesignLimiter, async (req, res) => {
  const parsed = recording.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Provide a voice recording under 2 MB.' });
  const providerUrl = process.env.VOICE_ANALYSIS_API_URL;
  if (!providerUrl) return res.status(503).json({ message: 'Voice analysis is not configured. Set VOICE_ANALYSIS_API_URL on the server.' });
  try {
    const response = await fetch(providerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.VOICE_ANALYSIS_API_KEY ? { Authorization: `Bearer ${process.env.VOICE_ANALYSIS_API_KEY}` } : {}) }, body: JSON.stringify({
      ...parsed.data,
      instructions: parsed.data.instructions || 'Return a concise JSON report with voiceOverview, astrologyReading, and personality fields. Make astrologyReading a warm symbolic reading inspired by audible qualities such as pace, pitch, resonance, and expressiveness, with a short theme and practical reflection. Do not claim a birth chart, zodiac sign, planetary placement, or destiny can be identified from voice. Label it entertainment and self-reflection. Base acoustic observations only on audible evidence and state when audio is insufficient. Do not diagnose or infer health conditions.'
    }), signal: AbortSignal.timeout(30000) });
    const data = await response.json().catch(() => null);
    if (!response.ok) return res.status(502).json({ message: 'The voice analysis provider could not process this recording.' });
    return res.json({ success: true, analysis: data });
  } catch { return res.status(502).json({ message: 'Unable to reach the voice analysis provider.' }); }
});

export default router;
