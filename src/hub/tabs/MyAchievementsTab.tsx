import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  ACHIEVEMENTS,
  Achievement,
  EarnedAchievement,
  serializeError,
} from "../../achievements/definitions";
import {
  refreshAchievements,
  loadCachedAchievements,
} from "../../achievements/evaluator";

function getTierEmoji(
  achievement: Achievement,
  earned: EarnedAchievement | undefined
): string | undefined {
  if (!earned || !achievement.tiers) return undefined;
  return achievement.tiers.find((t) => t.label === earned.currentTier)?.emoji;
}

export const MyAchievementsTab: React.FC = () => {
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

        const cached = await loadCachedAchievements(user.id);
        if (cached) {
          setEarned(cached);
          setLoading(false);
        } else {
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
      <div className="status-box">
        <span className="spinner">⏳</span>
        <p>Loading achievements…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-box">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button className="btn btn--primary" onClick={handleRefresh}>
          Retry
        </button>
      </div>
    );
  }

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e]));

  return (
    <>
      <div className="toolbar">
        <span className="toolbar__subtitle">
          {userName && <strong>{userName} · </strong>}
          {earned.length} of {ACHIEVEMENTS.length} achievements unlocked
        </span>
        <button
          className="btn"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "↺ Refresh"}
        </button>
      </div>

      <div className="badge-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const earnedEntry = earnedMap.get(achievement.id);
          const isEarned = !!earnedEntry;
          const tierEmoji = getTierEmoji(achievement, earnedEntry);

          return (
            <div
              key={achievement.id}
              className={`badge-card${isEarned ? "" : " locked"}`}
              title={
                isEarned
                  ? `Earned on ${new Date(earnedEntry!.earnedAt).toLocaleDateString()}`
                  : "Not yet earned"
              }
            >
              {tierEmoji && <span className="badge-tier">{tierEmoji}</span>}
              <div className="badge-icon">{achievement.icon}</div>
              <div className="badge-name">{achievement.name}</div>
              <div className="badge-desc">{achievement.description}</div>
              {isEarned && earnedEntry!.value > 1 && (
                <div className="badge-value">× {earnedEntry!.value}</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
