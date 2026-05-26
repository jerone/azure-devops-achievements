import React, { useEffect, useState } from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  getClient,
  CommonServiceIds,
  IProjectPageService,
} from "azure-devops-extension-api";
import { CoreRestClient } from "azure-devops-extension-api/Core";
import { MessageCard, MessageCardSeverity } from "azure-devops-ui/MessageCard";
import { Card } from "azure-devops-ui/Card";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { VssPersona } from "azure-devops-ui/VssPersona";
import { ZeroData } from "azure-devops-ui/ZeroData";
import {
  Table,
  ITableColumn,
  SimpleTableCell,
  TableColumnLayout,
} from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { ACHIEVEMENTS } from "../../achievements/achievements";
import { getAvatarUrl } from "../../achievements/avatarUrl";
import { serializeError } from "../../achievements/serializeError";
import { EarnedAchievement } from "../../achievements/models/EarnedAchievement";
import {
  loadCachedAchievements,
  refreshAchievements,
} from "../../achievements/evaluator";

interface TeamMember {
  id: string;
  displayName: string;
  imageUrl?: string;
  achievements: EarnedAchievement[];
}

function rankCell(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<TeamMember>,
  tableItem: TeamMember,
  itemProvider: ArrayItemProvider<TeamMember>
): JSX.Element {
  const rank = (itemProvider as any).value.indexOf(tableItem) + 1;
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  return (
    <SimpleTableCell
      key={`rank-${tableItem.id}`}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
    >
      <span style={{ fontSize: "1.1rem" }}>{medal}</span>
    </SimpleTableCell>
  );
}

function badgesCell(
  _rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<TeamMember>,
  tableItem: TeamMember
): JSX.Element {
  const icons = tableItem.achievements
    .map((e) => ACHIEVEMENTS.find((a) => a.id === e.achievementId)?.icon ?? "🏅")
    .join(" ");
  return (
    <SimpleTableCell
      key={`badges-${tableItem.id}`}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
    >
      <span style={{ fontSize: "1.1rem", letterSpacing: 2 }}>{icons || "—"}</span>
    </SimpleTableCell>
  );
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
            team.id,
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
              imageUrl: identity.descriptor
                ? await getAvatarUrl(identity.descriptor)
                : undefined,
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
      <div className="flex-row justify-center" style={{ padding: 40 }}>
        <Spinner size={SpinnerSize.large} label="Loading team leaderboard…" />
      </div>
    );
  }

  if (error) {
    return <MessageCard severity={MessageCardSeverity.Error}>{error}</MessageCard>;
  }

  if (members.length === 0) {
    return (
      <ZeroData
        primaryText="No achievement data yet"
        secondaryText="Have team members open the My Achievements tab first to generate their data."
        imageAltText="No data"
        imagePath=""
      />
    );
  }

  const itemProvider = new ArrayItemProvider(members);

  const columns: ITableColumn<TeamMember>[] = [
    {
      id: "rank",
      name: "Rank",
      width: 80,
      columnLayout: TableColumnLayout.none,
      renderCell: (rowIndex, columnIndex, tableColumn, tableItem) =>
        rankCell(rowIndex, columnIndex, tableColumn, tableItem, itemProvider),
    },
    {
      id: "displayName",
      name: "Member",
      width: -30,
      columnLayout: TableColumnLayout.none,
      renderCell: (_rowIndex, columnIndex, tableColumn, tableItem) => (
        <SimpleTableCell
          key={`name-${tableItem.id}`}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
        >
          <div className="flex-row flex-center" style={{ gap: 8 }}>
            <VssPersona
              imageUrl={tableItem.imageUrl}
              displayName={tableItem.displayName}
              size="extra-small"
              suppressPersonaCard
            />
            <span>{tableItem.displayName}</span>
          </div>
        </SimpleTableCell>
      ),
    },
    {
      id: "count",
      name: "Achievements",
      width: 140,
      columnLayout: TableColumnLayout.none,
      renderCell: (rowIndex, columnIndex, tableColumn, tableItem) => (
        <SimpleTableCell
          key={`count-${tableItem.id}`}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
        >
          {tableItem.achievements.length} / {ACHIEVEMENTS.length}
        </SimpleTableCell>
      ),
    },
    {
      id: "badges",
      name: "Badges",
      width: -70,
      columnLayout: TableColumnLayout.none,
      renderCell: badgesCell,
    },
  ];

  return (
    <Card 
      contentProps={{ contentPadding: false }}
      className="bolt-card-white"
      titleProps={{
        text: `${members.length} team member${members.length !== 1 ? "s" : ""} · showing cached achievements`,
        className: "body-m",
      }}
      >
      <Table<TeamMember>
        columns={columns}
        itemProvider={itemProvider}
        role="table"
        ariaLabel="Team achievements leaderboard"
      />
    </Card>
  );
};

