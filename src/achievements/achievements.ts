import { Achievement } from "./models/Achievement";

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


