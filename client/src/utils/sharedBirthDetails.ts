export type SharedBirthDetails = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timeZone?: number;
  timeZoneId?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
};

const STORAGE_KEY = 'voxigen.birth-details.v1';

export function readSharedBirthDetails(): SharedBirthDetails | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as SharedBirthDetails;
    if (!parsed.name || !parsed.birthDate || !parsed.birthPlace || !Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSharedBirthDetails(details: SharedBirthDetails) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(details)); } catch { /* Storage may be unavailable. */ }
}

export function getZoneOffset(date: string, time: string, timeZoneId: string) {
  const instant = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZoneId, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
  const localAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'));
  return (localAsUtc - instant.getTime()) / 3600000;
}
