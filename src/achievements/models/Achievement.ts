export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Emoji icon used as a fallback badge */
  icon: string;
  /** Optional tier thresholds: key = tier label, value = count required */
  tiers?: { label: string; emoji: string; threshold: number; }[];
}
