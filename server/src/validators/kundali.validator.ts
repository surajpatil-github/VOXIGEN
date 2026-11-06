import { z } from 'zod';

const birthDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
  .refine(value => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'Birth date must be a real calendar date')
  .refine(value => value <= new Date().toISOString().slice(0, 10), 'Birth date cannot be in the future');

export const generateKundaliSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  birthDate,
  birthTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Birth time must be in HH:mm format (24-hour)'),
  birthTimeUnknown: z.boolean().optional().default(false),
  birthPlace: z.string().trim().min(2, 'Place of birth is required'),
  latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  timeZone: z.number().min(-12).max(14, 'Timezone must be between -12 and 14'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().default('prefer_not_to_say')
});

export const updateKundaliSchema = generateKundaliSchema.partial();
