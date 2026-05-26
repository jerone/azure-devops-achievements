
export interface EarnedAchievement {
  achievementId: string;
  earnedAt: string;
  /** Current value (e.g. number of PRs merged), used for tiered achievements */
  value: number;
  /** The highest tier unlocked, if applicable */
  currentTier?: string;
}
