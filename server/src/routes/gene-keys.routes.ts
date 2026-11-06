import { Router } from 'express';
import { z } from 'zod';
import { humanDesignLimiter } from '../middleware/rateLimiter';

const router = Router();
const chartInput = z.object({
  name: z.string().trim().min(2).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  birthPlace: z.string().trim().min(2).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timeZoneId: z.string().trim().min(3).max(100)
});

router.post('/chart', humanDesignLimiter, async (req, res) => {
  const parsed = chartInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Enter a valid name, birth date, birth time, and birthplace.' });

  try {
    const { birthDate, birthTime, timeZoneId, latitude, longitude } = parsed.data;
    const providerUrl = new URL(process.env.GENE_KEYS_API_URL || 'https://freehumandesign.blvckstudios.com/api/genekeys');
    providerUrl.searchParams.set('date', birthDate);
    providerUrl.searchParams.set('time', birthTime);
    providerUrl.searchParams.set('tz', timeZoneId);
    providerUrl.searchParams.set('lat', String(latitude));
    providerUrl.searchParams.set('lng', String(longitude));
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.GENE_KEYS_API_KEY) headers.Authorization = `Bearer ${process.env.GENE_KEYS_API_KEY}`;
    const response = await fetch(providerUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return res.status(502).json({ success: false, message: 'Gene Keys calculation is temporarily unavailable. Please try again.' });
    const chart = await response.json();
    return res.json({ success: true, chart });
  } catch {
    return res.status(502).json({ success: false, message: 'Unable to reach the chart provider. Please try again.' });
  }
});

export default router;
