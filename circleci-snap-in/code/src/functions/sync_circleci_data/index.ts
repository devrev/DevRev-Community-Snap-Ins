import { ApiUtils } from "./utils";
import {
  WorkflowCompletedWebhook,
  JobCompletedWebhook,
  WebhookType,
} from "./types";
import {
  PartType,
  WorkType,
  TimelineEntriesCreateRequestType,
  Part,
  Work,
} from "@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk";

type CircleCIWebhook = WorkflowCompletedWebhook | JobCompletedWebhook;

async function handleEvent(event: any) {
  console.debug("[server] Handling event with payload ID: ", event.payload.id);
  const token = event.context.secrets["service_account_token"];
  const endpoint = event.execution_metadata.devrev_endpoint;

  const apiUtils = new ApiUtils(endpoint, token);
  console.debug("[server] Created ApiUtils instance");

  const dev_user_id: string = "DEVU-1";

  // parse the event payload as CircleCIWebhook
  const payload: CircleCIWebhook = event.payload;
  const project_name = payload.project.name;

  // create a part for the project if not existing already
  let part_id = "";
  const parts_response = await apiUtils.getParts(dev_user_id);
  if (parts_response.success) {
    const parts = parts_response.data.parts;
    const part = parts.find((p: Part) => p.name === project_name);
    if (!part) {
      const part_response = await apiUtils.createPart({
        type: PartType.Product,
        name: project_name,
        owned_by: [dev_user_id],
      });
      part_id = part_response.data.part.id;
      if (part_response.success) {
        console.debug(
          `[server] Created part for project ${project_name} successfully`,
        );
      } else {
        console.error(
          `[server] Failed to create part for project ${project_name}. Err: ${part_response.message}`,
        );
      }
    } else {
      part_id = part.id;
      console.debug(`[server] Part for project ${project_name} already exists`);
    }
  }

  let type;
  let title;
  let body;

  if (payload.type === WebhookType.workflow) {
    // map Workflow to Issue
    type = WorkType.Issue;
    title = payload.workflow.name;
    body = `Workflow with name ${payload.workflow.name} complete.\n\nStatus: ${payload.workflow.status}.\n\nURL: ${payload.workflow.url}`;
  } else {
    // map Job to Task
    type = WorkType.Task;
    title = payload.job.name;
    body = `Job with name ${payload.job.name} complete.\n\nStatus: ${payload.job.status}.\n\nID: ${payload.job.id}`;
  }

  // create work in DevRev if not already existing
  const works_response = await apiUtils.getWorks(dev_user_id);
  let work_id = "";
  if (works_response.success) {
    const works = works_response.data.works;
    const work = works.find((w: Work) => w.title === title);
    if (!work) {
      const work_response = await apiUtils.createWork({
        type: type,
        applies_to_part: part_id,
        owned_by: [dev_user_id],
        title: title,
      });

      work_id = work_response.data.work.id;
      if (work_response.success) {
        console.debug(`[server] Created work for ${title} successfully`);
      } else {
        console.error(
          `[server] Failed to create work for ${title}. Err: ${work_response.message}`,
        );
      }
    } else {
      work_id = work.id;
      console.debug(`[server] Work for ${title} already exists`);
    }
  }

  // create a timelineEvent for the work
  const timeline_event_response = await apiUtils.createTimeLine({
    type: TimelineEntriesCreateRequestType.TimelineComment,
    object: work_id,
    body: body,
  });
  if (timeline_event_response.success) {
    console.debug(
      `[server] Created timeline event for work ${work_id} successfully`,
    );
  } else {
    console.error(
      `[server] Failed to create timeline event for work ${work_id}. Err: ${timeline_event_response.message}`,
    );
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
