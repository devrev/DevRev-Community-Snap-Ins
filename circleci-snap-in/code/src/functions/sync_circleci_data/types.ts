export interface CircleCIWebhookBase {
  id: string;
  type: WebhookType;
  happened_at: string; // ISO 8601 timestamp
  webhook: {
    id: string;
    name: string;
  };
  project: Project;
  organization: Organization;
  pipeline: Pipeline;
}

export interface WorkflowCompletedWebhook extends CircleCIWebhookBase {
  type: WebhookType.workflow;
  workflow: WorkflowWithStatus;
}

export interface JobCompletedWebhook extends CircleCIWebhookBase {
  type: WebhookType.job;
  workflow: Workflow;
  job: Job;
}

// Common Sub-Entities
export interface Project {
  id: string;
  name: string;
  slug: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Pipeline {
  id: string;
  number: number;
  created_at: string; // ISO 8601
  trigger: Trigger;
  vcs?: Vcs;
  trigger_parameters?: {
    [key: string]: any; // Dynamic parameters
  };
}

export interface Trigger {
  type: "webhook" | "api" | "scheduled_pipeline" | "explicit";
}

export interface Vcs {
  provider_name: string;
  origin_repository_url?: string;
  target_repository_url?: string;
  revision?: string;
  commit?: Commit;
  branch?: string;
  tag?: string;
}

export interface Commit {
  subject?: string;
  body?: string;
  author?: Author;
  committer?: Author;
  authored_at?: string; // ISO 8601
  committed_at?: string; // ISO 8601
}

export interface Author {
  name?: string;
  email?: string;
}

export interface Job {
  id: string;
  number: number;
  name: string;
  status: JobStatus;
  started_at: string; // ISO 8601
  stopped_at?: string; // ISO 8601
}

export interface Workflow {
  id: string;
  name: string;
  created_at: string; // ISO 8601
  stopped_at?: string; // ISO 8601
  url: string;
}

export interface WorkflowWithStatus extends Workflow {
  status: WorkflowStatus;
}

// Enums
enum JobStatus {
  Success = "success",
  Failed = "failed",
  Running = "running",
  Blocked = "blocked",
  Canceled = "canceled",
}

enum WorkflowStatus {
  Success = "success",
  Failed = "failed",
  Error = "error",
  Canceled = "canceled",
  Unauthorized = "unauthorized",
}

export enum WebhookType {
  job = "job-completed",
  workflow = "workflow-completed",
}
