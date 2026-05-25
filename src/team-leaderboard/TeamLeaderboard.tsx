import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  getClient,
  CommonServiceIds,
  IProjectPageService,
} from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { ACHIEVEMENTS, EarnedAchievement, serializeError } from "../achievements/definitions";
import { loadCachedAchievements, refreshAchievements } from "../achievements/evaluator";
import "../achievements/styles.css";

interface TeamMember {
  id: string;
  displayName: string;
  achievements: EarnedAchievement[];
}

export const TeamLeaderboard: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await SDK.ready();

        // Load current user's own achievements first (refreshes if needed)
        await refreshAchievements();

        // Fetch all project team members via the Core API
        const core = getClient(CoreRestClient);
        const projectService = await SDK.getService<IProjectPageService>(
          CommonServiceIds.ProjectPageService
        );
        const project = await projectService.getProject();
        const projectId = project?.id ?? "";

        // Get all teams in the project, then collect unique members
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

        // Sort by achievement count descending
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
      <div className="status-message">
        <span className="spinner">⏳</span>
        <p>Loading leaderboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-message">
        <p>❌ Failed to load leaderboard: {error}</p>
      </div>
    );
  }

  const rankLabel = (rank: number) => {
    if (rank === 1) return <span className="rank-badge rank-1">🥇</span>;
    if (rank === 2) return <span className="rank-badge rank-2">🥈</span>;
    if (rank === 3) return <span className="rank-badge rank-3">🥉</span>;
    return <span className="rank-badge">#{rank}</span>;
  };

  const earnedIcons = (achievements: EarnedAchievement[]) =>
    achievements
      .map((e) => ACHIEVEMENTS.find((a) => a.id === e.achievementId)?.icon ?? "🏅")
      .join(" ");

  return (
    <div className="achievements-page">
      <h1>🏆 Achievements Leaderboard</h1>
      <p className="subtitle">
        Showing cached achievements for {members.length} team member(s)
      </p>

      {members.length === 0 ? (
        <p>No achievement data found yet. Have team members open their personal Achievements hub first.</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Member</th>
              <th>Achievements</th>
              <th>Badges</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr key={member.id}>
                <td>{rankLabel(idx + 1)}</td>
                <td>{member.displayName}</td>
                <td>{member.achievements.length} / {ACHIEVEMENTS.length}</td>
                <td style={{ fontSize: "1.2rem" }}>
                  {earnedIcons(member.achievements) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
