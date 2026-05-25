import * as SDK from "azure-devops-extension-sdk";
import {
  getClient,
  CommonServiceIds,
  IProjectPageService,
} from "azure-devops-extension-api";
import { GitRestClient, GitPullRequestSearchCriteria } from "azure-devops-extension-api/Git";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { BuildRestClient } from "azure-devops-extension-api/Build";
import { TestRestClient } from "azure-devops-extension-api/Test";
import { ACHIEVEMENTS, EarnedAchievement } from "./definitions";

/** Metrics gathered from the ADO REST APIs for a single user */
interface UserMetrics {
  mergedPRs: number;
  prReviews: number;
  yoloPRs: number; // merged with no required reviewers
  quickdrawItems: number; // work items closed <5 min after creation
  bugsFixed: number;
  successfulBuilds: number;
  hasPipelineRun: boolean;
  hasSprintCompletion: boolean;
  hasWorkItem: boolean;
  hasPairCommit: boolean;
  prComments: number;
  passingTestRuns: number;
}

async function getProjectId(): Promise<string> {
  const projectService = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );
  const project = await projectService.getProject();
  return project?.id ?? "";
}

/** Fetches all relevant metrics for the given user descriptor / display name */
export async function gatherMetrics(
  userId: string,
  projectId: string
): Promise<UserMetrics> {
  const git = getClient(GitRestClient);
  const wit = getClient(WorkItemTrackingRestClient);
  const build = getClient(BuildRestClient);
  const test = getClient(TestRestClient);

  const metrics: UserMetrics = {
    mergedPRs: 0,
    prReviews: 0,
    yoloPRs: 0,
    quickdrawItems: 0,
    bugsFixed: 0,
    successfulBuilds: 0,
    hasPipelineRun: false,
    hasSprintCompletion: false,
    hasWorkItem: false,
    hasPairCommit: false,
    prComments: 0,
    passingTestRuns: 0,
  };

  try {
    // ── Pull Requests ─────────────────────────────────────────────────────
    const repos = await git.getRepositories(projectId);
    let totalMerged = 0;
    let totalReviews = 0;
    let yolo = 0;
    let prComments = 0;
    let hasPairCommit = false;

    for (const repo of repos) {
      // PRs created by this user that are completed (merged)
      const prs = await git.getPullRequests(repo.id!, {
        creatorId: userId,
        status: 3, // Completed
      } as GitPullRequestSearchCriteria);
      totalMerged += prs.length;

      for (const pr of prs) {
        // YOLO: no required reviewers
        const reviewers = pr.reviewers ?? [];
        const hasReviewer = reviewers.some((r) => r.isRequired || r.vote !== 0);
        if (!hasReviewer) yolo++;

        // Pair programmer: check commit co-authors
        if (!hasPairCommit) {
          const commits = await git.getPullRequestCommits(repo.id!, pr.pullRequestId!);
          for (const commit of commits) {
            if ((commit.comment ?? "").toLowerCase().includes("co-authored-by:")) {
              hasPairCommit = true;
              break;
            }
          }
        }
      }

      // PR reviews by this user
      const reviewed = await git.getPullRequests(repo.id!, {
        reviewerId: userId,
        status: 3,
      } as GitPullRequestSearchCriteria);
      totalReviews += reviewed.length;

      // PR comments by this user (threads)
      for (const pr of [...prs, ...reviewed]) {
        const threads = await git.getThreads(repo.id!, pr.pullRequestId!);
        for (const thread of threads) {
          const userComments = (thread.comments ?? []).filter(
            (c) => c.author?.id === userId && !c.isDeleted
          );
          prComments += userComments.length;
        }
      }
    }

    metrics.mergedPRs = totalMerged;
    metrics.prReviews = totalReviews;
    metrics.yoloPRs = yolo;
    metrics.prComments = prComments;
    metrics.hasPairCommit = hasPairCommit;

    // ── Work Items ────────────────────────────────────────────────────────
    const wiql = {
      query: `SELECT [System.Id], [System.CreatedDate], [System.State], [System.WorkItemType], [Microsoft.VSTS.Common.ClosedDate]
              FROM WorkItems
              WHERE [System.AssignedTo] = @Me
                AND [System.TeamProject] = '${projectId}'`,
    };
    const wiqlResult = await wit.queryByWiql(wiql, projectId);
    const workItemRefs = wiqlResult.workItems ?? [];

    if (workItemRefs.length > 0) {
      metrics.hasWorkItem = true;
    }

    // Fetch work item details in batches of 200
    const batchSize = 200;
    for (let i = 0; i < workItemRefs.length; i += batchSize) {
      const batch = workItemRefs.slice(i, i + batchSize);
      const ids = batch.map((w) => w.id!);
      const items = await wit.getWorkItems(ids, projectId, [
        "System.WorkItemType",
        "System.State",
        "System.CreatedDate",
        "Microsoft.VSTS.Common.ClosedDate",
      ]);

      for (const item of items) {
        const type: string = item.fields?.["System.WorkItemType"] ?? "";
        const state: string = item.fields?.["System.State"] ?? "";
        const created: string = item.fields?.["System.CreatedDate"] ?? "";
        const closed: string = item.fields?.["Microsoft.VSTS.Common.ClosedDate"] ?? "";

        if (type.toLowerCase() === "bug" && state === "Done") {
          metrics.bugsFixed++;
        }

        // Quickdraw: closed within 5 minutes of creation
        if (state === "Done" && created && closed) {
          const diffMs = new Date(closed).getTime() - new Date(created).getTime();
          if (diffMs >= 0 && diffMs <= 5 * 60 * 1000) {
            metrics.quickdrawItems++;
          }
        }
      }
    }

    // ── Builds ────────────────────────────────────────────────────────────
    const builds = await build.getBuilds(
      projectId,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      userId
    );

    const successful = builds.filter((b) => b.result === 2); // 2 = succeeded
    metrics.successfulBuilds = successful.length;
    metrics.hasPipelineRun = builds.length > 0;

    // ── Tests ─────────────────────────────────────────────────────────────
    const testRuns = await test.getTestRuns(projectId);
    metrics.passingTestRuns = testRuns.filter(
      (r) => r.state === "Completed" && r.passedTests > 0
    ).length;
  } catch (err) {
    console.warn("[Achievements] Error gathering metrics:", err);
  }

  return metrics;
}

/** Evaluates which achievements the user has earned based on gathered metrics */
export function evaluateAchievements(metrics: UserMetrics): EarnedAchievement[] {
  const now = new Date().toISOString();
  const earned: EarnedAchievement[] = [];

  const check = (
    id: string,
    value: number,
    threshold: number = 1
  ) => {
    if (value >= threshold) {
      const achievement = ACHIEVEMENTS.find((a) => a.id === id);
      if (!achievement) return;

      let currentTier: string | undefined;
      if (achievement.tiers) {
        const unlockedTiers = achievement.tiers.filter((t) => value >= t.threshold);
        if (unlockedTiers.length > 0) {
          currentTier = unlockedTiers[unlockedTiers.length - 1].label;
        } else {
          return; // no tier unlocked yet
        }
      }

      earned.push({ achievementId: id, earnedAt: now, value, currentTier });
    }
  };

  check("pull-shark", metrics.mergedPRs);
  check("code-reviewer", metrics.prReviews);
  check("yolo", metrics.yoloPRs);
  check("quickdraw", metrics.quickdrawItems);
  check("bug-squasher", metrics.bugsFixed);
  check("pipeline-pioneer", metrics.hasPipelineRun ? 1 : 0);
  check("build-master", metrics.successfulBuilds);
  check("sprint-warrior", metrics.hasSprintCompletion ? 1 : 0);
  check("first-blood", metrics.hasWorkItem ? 1 : 0);
  check("pair-programmer", metrics.hasPairCommit ? 1 : 0);
  check("comment-king", metrics.prComments);
  check("green-guardian", metrics.passingTestRuns);

  return earned;
}

/** Loads cached achievements from the Extension Data Service */
export async function loadCachedAchievements(
  userId: string
): Promise<EarnedAchievement[] | null> {
  try {
    const dataService = await SDK.getService<any>(
      CommonServiceIds.ExtensionDataService
    );
    const dataManager = await dataService.getExtensionDataManager(
      SDK.getExtensionContext().id,
      await SDK.getAccessToken()
    );
    return (await dataManager.getValue(
      `achievements-${userId}`,
      { scopeType: "User" }
    )) as EarnedAchievement[] | null;
  } catch {
    return null;
  }
}

/** Persists earned achievements to the Extension Data Service */
export async function saveAchievements(
  userId: string,
  achievements: EarnedAchievement[]
): Promise<void> {
  try {
    const dataService = await SDK.getService<any>(
      CommonServiceIds.ExtensionDataService
    );
    const dataManager = await dataService.getExtensionDataManager(
      SDK.getExtensionContext().id,
      await SDK.getAccessToken()
    );
    await dataManager.setValue(`achievements-${userId}`, achievements, {
      scopeType: "User",
    });
  } catch (err) {
    console.warn("[Achievements] Failed to save achievements:", err);
  }
}

/** High-level helper: refresh achievements for the current user */
export async function refreshAchievements(): Promise<EarnedAchievement[]> {
  await SDK.ready();
  const user = SDK.getUser();
  const projectId = await getProjectId();

  const metrics = await gatherMetrics(user.id, projectId);
  const earned = evaluateAchievements(metrics);
  await saveAchievements(user.id, earned);
  return earned;
}
