import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { ACHIEVEMENTS } from "../achievements/achievements";
import { serializeError } from "../achievements/serializeError";
import { EarnedAchievement } from "../achievements/models/EarnedAchievement";
import { Achievement } from "../achievements/models/Achievement";
import {
  refreshAchievements,
  loadCachedAchievements,
} from "../achievements/evaluator";
import "../achievements/styles.css"; 

function getTierEmoji(achievement: Achievement, earned: EarnedAchievement | undefined): string | undefined {
  if (!earned || !achievement.tiers) return undefined;
  const tier = achievement.tiers.find((t) => t.label === earned.currentTier);
  return tier?.emoji;
}

export const MyAchievements: React.FC = () => {
  const [earned, setEarned] = useState<EarnedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        await SDK.ready();
        const user = SDK.getUser();
        setUserName(user.displayName ?? user.name ?? "You");

        // Try cached data first for fast load
        const cached = await loadCachedAchievements(user.id);
        if (cached) {
          setEarned(cached);
          setLoading(false);
        } else {
          // No cache - do a full refresh
          const fresh = await refreshAchievements();
          setEarned(fresh);
          setLoading(false);
        }
      } catch (err) {
        setError(serializeError(err));
        setLoading(false);
      }
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const fresh = await refreshAchievements();
      setEarned(fresh);
    } catch (err) {
      setError(serializeError(err));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="status-message">
        <span className="spinner">⏳</span>
        <p>Loading your achievements…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-message">
        <p>❌ Failed to load achievements: {error}</p>
        <button className="btn-refresh" onClick={handleRefresh}>Retry</button>
      </div>
    );
  }

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e]));

  return (
    <div className="achievements-page">
      <h1>🏆 {userName}'s Achievements</h1>
      <p className="subtitle">
        {earned.length} of {ACHIEVEMENTS.length} achievements unlocked
      </p>

      <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
        {refreshing ? "Refreshing…" : "🔄 Refresh"}
      </button>

      <div className="badge-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const earnedEntry = earnedMap.get(achievement.id);
          const isEarned = !!earnedEntry;
          const tierEmoji = getTierEmoji(achievement, earnedEntry);

          return (
            <div
              key={achievement.id}
              className={`badge-card ${isEarned ? "earned" : "locked"}`}
              title={isEarned ? `Earned on ${new Date(earnedEntry.earnedAt).toLocaleDateString()}` : "Not yet earned"}
            >
              {tierEmoji && <span className="badge-tier">{tierEmoji}</span>}
              <div className="badge-icon">{achievement.icon}</div>
              <div className="badge-name">{achievement.name}</div>
              <div className="badge-desc">{achievement.description}</div>
              {isEarned && earnedEntry.value > 1 && (
                <div className="badge-value">× {earnedEntry.value}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
