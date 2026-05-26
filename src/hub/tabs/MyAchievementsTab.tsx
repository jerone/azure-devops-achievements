import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import { Button } from "azure-devops-ui/Button";
import { Card } from "azure-devops-ui/Card";
import { TitleSize } from "azure-devops-ui/Header";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { VssPersona } from "azure-devops-ui/VssPersona";
import { getAvatarUrl } from "../../achievements/avatarUrl";
import { ACHIEVEMENTS } from "../../achievements/achievements";
import { serializeError } from "../../achievements/serializeError";
import { EarnedAchievement } from "../../achievements/models/EarnedAchievement";
import { Achievement } from "../../achievements/models/Achievement";
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
  const [userImageUrl, setUserImageUrl] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        await SDK.ready();
        const user = SDK.getUser();
        setUserName(user.displayName ?? user.name ?? "You");
        setUserImageUrl(await getAvatarUrl(user.descriptor));

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
      <div className="flex-row justify-center" style={{ padding: 40 }}>
        <Spinner size={SpinnerSize.large} label="Loading achievements…" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <MessageCard severity={MessageCardSeverity.Error}>{error}</MessageCard>
        <div style={{ marginTop: 12 }}>
          <Button text="Retry" primary onClick={handleRefresh} />
        </div>
      </>
    );
  }

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e]));

  return (
    <>
      <div className="flex-row flex-center justify-space-between" style={{ marginBottom: 16 }}>
        <div className="flex-row flex-center" style={{ gap: 8 }}>
          <VssPersona
            imageUrl={userImageUrl}
            displayName={userName}
            size="small"
            suppressPersonaCard
          />
          <span className="body-m secondary-text">
            {userName && <strong className="primary-text">{userName} · </strong>}
            {earned.length} of {ACHIEVEMENTS.length} achievements unlocked
          </span>
        </div>
        <Button
          text={refreshing ? "Refreshing…" : "Refresh"}
          iconProps={{ iconName: "Refresh" }}
          disabled={refreshing}
          onClick={handleRefresh}
        />
      </div>

      <div className="badge-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const earnedEntry = earnedMap.get(achievement.id);
          const isEarned = !!earnedEntry;
          const tierEmoji = getTierEmoji(achievement, earnedEntry);

          return (
            <Card
              key={achievement.id}
              className={`bolt-card-white badge-card${isEarned ? "" : " badge-card--locked"}`}
              titleProps={{
                text: achievement.name,
                size: TitleSize.Small,
              }}
            >
              <div className="badge-card__body">
                {tierEmoji && <span className="badge-tier">{tierEmoji}</span>}
                <div className="badge-icon">{achievement.icon}</div>
                <div className="body-s secondary-text badge-desc">{achievement.description}</div>
                {isEarned && earnedEntry.value > 1 && (
                  <div className="body-s badge-value">× {earnedEntry.value}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
};

