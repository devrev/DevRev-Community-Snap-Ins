import { ApiUtils } from "./utils";
import {
  WorkflowCompletedWebhook,
  JobCompletedWebhook,
  WebhookType,
} from "./types";
import {
  PartType,
  WorkType,
} from "@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk";

type CircleCIWebhook = WorkflowCompletedWebhook | JobCompletedWebhook;

async function handleEvent(event: any) {
  console.debug("[server] Handling event with payload ID: ", event.payload.id);
  const token = event.context.secrets["service_account_token"];
  const endpoint = event.execution_metadata.devrev_endpoint;
  const dev = event.context.dev_oid;

  const apiUtils = new ApiUtils(endpoint, token);
  console.debug("[server] Created ApiUtils instance");
  // parse the event payload as CircleCIWebhook
  const payload: CircleCIWebhook = event.payload;
  const project_slug = payload.project.slug;

  // create a part for the project
  const part = await apiUtils.createPart({
    type: PartType.Product,
    name: project_slug,
    owned_by: dev,
  });
  const part_id = part.data.id;
  console.debug("[server] Created part for project: ", part_id);
  let type;
  let title;

  if (payload.type === WebhookType.workflow) {
    // map Workflow to Issue
    type = WorkType.Issue;
    title = payload.workflow.name;
  } else {
    // map Job to Task
    type = WorkType.Task;
    title = payload.job.name;

    // TODO: figure out how to fetch steps from the job and populate timeline in DevRev
  }

  // create work in DevRev
  const response = await apiUtils.createIssueOrTask({
    type: type,
    applies_to_part: part_id,
    owned_by: dev,
    title: title,
  });
  console.debug("[server] Created work: ", response.data.id);

  return response;
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
