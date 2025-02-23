import { raw } from "body-parser";
import { JobArtifactAnalyzer, ApiUtils } from "./utils";
import { TimelineEntriesCreateRequestType } from "@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk";

async function handleEvent(event: any) {
  const token = event.context.secrets["service_account_token"];
  const endpoint = event.execution_metadata.devrev_endpoint;

  const apiUtils = new ApiUtils(endpoint, token);

  const groqApiKey = event.input_data.keyrings.groq_api_key;
  const circleCIToken = event.input_data.keyrings.circleci_api_key;

  const projectSlug = event.context.secrets.project_slug;
  const jobId = event.payload.parameters.trim();

  const analyzer = new JobArtifactAnalyzer(
    circleCIToken,
    projectSlug,
    groqApiKey,
  );

  // retrieve all artifacts
  const artifacts = await analyzer.fetchJobArtifacts(jobId);

  const safeStringify = (data: any) => {
    try {
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      return "[Non-serializable data]";
    }
  };

  // Create a contextual combined string
  const raw_data = artifacts
    .map(
      (artifact) =>
        `=== ARTIFACT: ${artifact.path} ===\n` +
        `Node: ${artifact.node_index}\n` +
        `URL: ${artifact.url}\n` +
        `Content:\n${safeStringify(artifact.data)}\n\n`,
    )
    .join("\n");

  const MAX_CONTENT_LENGTH = 100000; // Adjust based on LLM limits

  let combinedData = `Artifact Analysis Summary
  Job ID: ${jobId}
  Total Artifacts: ${artifacts.length}
  =======================\n\n`;

  if (raw_data.length > MAX_CONTENT_LENGTH) {
    console.warn(
      `Content exceeds ${MAX_CONTENT_LENGTH} characters. Truncating...`,
    );
    combinedData += raw_data.slice(0, MAX_CONTENT_LENGTH);
  } else {
    combinedData += raw_data;
  }

  // generate insights
  const insights = await analyzer.generateInsights(combinedData);

  // add to timeline
  await apiUtils.createTimeLine({
    type: TimelineEntriesCreateRequestType.TimelineComment,
    object: jobId,
    body: insights,
  });
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
