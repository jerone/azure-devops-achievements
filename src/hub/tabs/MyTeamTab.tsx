import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  getClient,
  CommonServiceIds,
  IProjectPageService,
} from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import {
  ACHIEVEMENTS,
  EarnedAchievement,
  serializeError,
} from "../../achievements/definitions";
import {
  loadCachedAchievements,
  refreshAchievements,
} from "../../achievements/evaluator";

interface TeamMember {
  id: string;
  displayName: string;
  achievements: EarnedAchievement[];
}

export const MyTeamTab: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await SDK.ready();

        // Ensure current user's achievements are up to date
        await refreshAchievements();

        const core = getClient(CoreRestClient);
        const projectService = await SDK.getService<IProjectPageService>(
          CommonServiceIds.ProjectPageService
        );
        const project = await projectService.getProject();
        const projectId = project?.id ?? "";

        const teams = await core.getTeams(projectId, false, 100);
        const seenIds = new Set<string>();
        const memberData: TeamMember[] = [];

        for (const team of teams) {
          const teamMembers = await core.getTeamMembersWithExtendedProperties(
            projectId,
            team.id!,
            100
          );
          for (const tm of teamMembers) {
            const identity = tm.identity;
            if (!identity?.id || seenIds.has(identity.id)) continue;
            seenIds.add(identity.id);

            const cached = await loadCachedAchievements(identity.id);
            memberData.push({
              id: identity.id,
              displayName: identity.displayName ?? "Unknown",
              achievements: cached ?? [],
            });
          }
        }

        memberData.sort((a, b) => b.achievements.length - a.achievements.length);
        setMembers(memberData);
      } catch (err) {
        setError(serializeError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="status-box">
        <span className="spinner">⏳</span>
        <p>Loading team leaderboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-box">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  const rankLabel = (rank: number) => {
    if (rank === 1) return <span className="rank-badge gold">🥇</span>;
    if (rank === 2) return <span className="rank-badge silver">🥈</span>;
    if (rank === 3) return <span className="rank-badge bronze">🥉</span>;
    return <span className="rank-badge">#{rank}</span>;
  };

  const earnedIcons = (achievements: EarnedAchievement[]) =>
    achievements
      .map((e) => ACHIEVEMENTS.find((a) => a.id === e.achievementId)?.icon ?? "🏅")
      .join(" ");

  return (
    <>
      <div className="toolbar">
        <span className="toolbar__subtitle">
          {members.length} team member{members.length !== 1 ? "s" : ""} · showing cached achievements
        </span>
      </div>

      {members.length === 0 ? (
        <div className="status-box">
          <span style={{ fontSize: "2rem" }}>👥</span>
          <p>
            No achievement data yet. Have team members open the{" "}
            <strong>My Achievements</strong> tab first to generate their data.
          </p>
        </div>
      ) : (
        <table className="ado-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>Rank</th>
              <th>Member</th>
              <th style={{ width: 160 }}>Achievements</th>
              <th>Badges</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr key={member.id}>
                <td>{rankLabel(idx + 1)}</td>
                <td>{member.displayName}</td>
                <td>
                  {member.achievements.length} / {ACHIEVEMENTS.length}
                </td>
                <td style={{ fontSize: "1.15rem", letterSpacing: "2px" }}>
                  {earnedIcons(member.achievements) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};
