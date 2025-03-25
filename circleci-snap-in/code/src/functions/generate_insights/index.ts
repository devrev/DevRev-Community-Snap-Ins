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

  // Retrieve all artifacts
  const artifacts = await analyzer.fetchJobArtifacts(jobId);

  // Process artifacts through the agent pipeline
  const issueAnalysis = await analyzer.issueAnalyzerAgent.processArtifacts(artifacts);
  const recommendations = await analyzer.solutionRecommenderAgent.generateRecommendations(issueAnalysis);
  const verifiedSolutions = await analyzer.solutionVerifierAgent.verifySolutions(recommendations);

  const timelineBody = formatSolutionsAsMarkdown(jobId, issueAnalysis, verifiedSolutions);

  // Create timeline entry with the final results
  await apiUtils.createTimeLine({
    type: TimelineEntriesCreateRequestType.TimelineComment,
    object: jobId,
    body: timelineBody,
  });
}

function formatSolutionsAsMarkdown(jobId: string, analysis: any, solutions: any[]): string {
  let markdown = `## CI/CD Analysis Report for Job ${jobId}\n\n`;
  
  // Add summary section
  markdown += `### Summary\n`;
  markdown += `${analysis.summary}\n\n`;
  
  // Add detailed solutions
  markdown += `### Recommended Solutions\n`;
  solutions.forEach((solution, index) => {
    markdown += `#### ${index + 1}. ${solution.issue}\n`;
    markdown += `- **Recommended Solution**: ${solution.recommendedSolution}\n`;
    markdown += `- **Confidence**: ${solution.confidenceLevel}\n`;
    markdown += `- **Verification Status**: ${solution.verificationStatus}\n`;
    
    if (solution.historicalMatches && solution.historicalMatches.length > 0) {
      markdown += `- **Historical Matches**:\n`;
      solution.historicalMatches.forEach((match: any) => {
        markdown += `  - ${match}\n`;
      });
    }
    markdown += `\n`;
  });

  return markdown;
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
