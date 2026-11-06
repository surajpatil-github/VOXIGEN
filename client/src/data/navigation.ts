import type { LucideIcon } from 'lucide-react';
import { Calendar, Compass, HeartHandshake, Info, Mail, Sparkles } from 'lucide-react';

export interface NavigationLink {
  label: string;
  path: string;
  icon?: LucideIcon;
}

/** Main links shown in the desktop navigation and mobile menu. */
export const navLinks: NavigationLink[] = [
  { label: 'Home', path: '/' },
  { label: 'Kundli', path: '/free-kundali', icon: Compass },
  { label: 'Voice', path: '/voice', icon: Sparkles },
  { label: 'Matching', path: '/compatibility', icon: HeartHandshake },
  { label: 'Gene Keys', path: '/gene-keys' },
  { label: 'Human Design', path: '/human-design' },
  { label: 'Contact', path: '/contact', icon: Mail },
  { label: 'Services', path: '/panchang', icon: Calendar },
  { label: 'More', path: '/about', icon: Info },
];
