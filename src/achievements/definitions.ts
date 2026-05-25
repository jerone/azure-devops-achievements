export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Emoji icon used as a fallback badge */
  icon: string;
  /** Optional tier thresholds: key = tier label, value = count required */
  tiers?: { label: string; emoji: string; threshold: number }[];
}

/** All available achievements in the extension */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "pull-shark",
    name: "Pull Shark",
    description: "Merge your first pull request.",
    icon: "🦈",
    tiers: [
      { label: "Bronze", emoji: "🥉", threshold: 2 },
      { label: "Silver", emoji: "🥈", threshold: 10 },
      { label: "Gold", emoji: "🥇", threshold: 50 },
    ],
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "Review pull requests left by your teammates.",
    icon: "🔍",
    tiers: [
      { label: "Bronze", emoji: "🥉", threshold: 5 },
      { label: "Silver", emoji: "🥈", threshold: 25 },
      { label: "Gold", emoji: "🥇", threshold: 100 },
    ],
  },
  {
    id: "yolo",
    name: "YOLO",
    description: "Merge a pull request without any reviewers.",
    icon: "💥",
  },
  {
    id: "quickdraw",
    name: "Quickdraw",
    description: "Close a work item within 5 minutes of creating it.",
    icon: "⚡",
  },
  {
    id: "bug-squasher",
    name: "Bug Squasher",
    description: "Close bug work items.",
    icon: "🐛",
    tiers: [
      { label: "Bronze", emoji: "🥉", threshold: 5 },
      { label: "Silver", emoji: "🥈", threshold: 25 },
      { label: "Gold", emoji: "🥇", threshold: 100 },
    ],
  },
  {
    id: "pipeline-pioneer",
    name: "Pipeline Pioneer",
    description: "Successfully run your first pipeline.",
    icon: "🚀",
  },
  {
    id: "build-master",
    name: "Build Master",
    description: "Trigger successful builds.",
    icon: "🏗️",
    tiers: [
      { label: "Bronze", emoji: "🥉", threshold: 10 },
      { label: "Silver", emoji: "🥈", threshold: 50 },
      { label: "Gold", emoji: "🥇", threshold: 250 },
    ],
  },
  {
    id: "sprint-warrior",
    name: "Sprint Warrior",
    description: "Complete all assigned work items in a sprint.",
    icon: "🏃",
  },
  {
    id: "first-blood",
    name: "First Blood",
    description: "Create your very first work item.",
    icon: "🩸",
  },
  {
    id: "pair-programmer",
    name: "Pair Programmer",
    description: "Co-author a commit in a merged pull request.",
    icon: "👫",
  },
  {
    id: "comment-king",
    name: "Comment King",
    description: "Leave comments on pull requests.",
    icon: "👑",
    tiers: [
      { label: "Bronze", emoji: "🥉", threshold: 20 },
      { label: "Silver", emoji: "🥈", threshold: 100 },
      { label: "Gold", emoji: "🥇", threshold: 500 },
    ],
  },
  {
    id: "green-guardian",
    name: "Green Guardian",
    description: "Accumulate passing test runs.",
    icon: "🟢",
    tiers: [
      { label: "Bronze", emoji: "🥉", threshold: 50 },
      { label: "Silver", emoji: "🥈", threshold: 250 },
      { label: "Gold", emoji: "🥇", threshold: 1000 },
    ],
  },
];

export interface EarnedAchievement {
  achievementId: string;
  earnedAt: string;
  /** Current value (e.g. number of PRs merged), used for tiered achievements */
  value: number;
  /** The highest tier unlocked, if applicable */
  currentTier?: string;
}

/**
 * Safely converts any thrown value to a readable string.
 * The ADO SDK and REST clients sometimes throw plain objects rather than Error instances.
 */
export function serializeError(err: unknown): string {
  if (err == null) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.toString();
  try {
    // Plain objects from the ADO REST client often look like { status, message, ... }
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.responseText === "string") return obj.responseText;
    return JSON.stringify(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}
