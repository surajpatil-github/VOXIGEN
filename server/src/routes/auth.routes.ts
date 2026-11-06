import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

router.post('/login', async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });
  const providerUrl = process.env.VOXIGEN_AUTH_URL;
  if (!providerUrl) return res.status(503).json({ message: 'Login is not configured yet. Set VOXIGEN_AUTH_URL on the server.' });
  try {
    const response = await fetch(providerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.VOXIGEN_AUTH_KEY ? { Authorization: `Bearer ${process.env.VOXIGEN_AUTH_KEY}` } : {}) }, body: JSON.stringify(parsed.data), signal: AbortSignal.timeout(12000) });
    const data: any = await response.json().catch(() => null);
    if (!response.ok) return res.status(response.status === 401 ? 401 : 502).json({ message: response.status === 401 ? 'Email or password is incorrect.' : 'The login provider could not complete sign in.' });
    if (!data?.token) return res.status(502).json({ message: 'The login provider returned an invalid response.' });
    return res.json({ token: data.token, user: data.user || { email: parsed.data.email } });
  } catch { return res.status(502).json({ message: 'Unable to reach the login provider.' }); }
});

export default router;
