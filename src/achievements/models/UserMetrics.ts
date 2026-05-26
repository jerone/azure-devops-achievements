/** Metrics gathered from the ADO REST APIs for a single user */
export interface UserMetrics {
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
