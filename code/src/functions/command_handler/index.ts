import { client, publicSDK } from '@devrev/typescript-sdk';
import { Octokit } from '@octokit/core';

interface RepoDetails {
  name: string;
  full_name: string;
  owner: Owner;
  html_url: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  language: string | null;
  default_branch: string;
  open_issues_count?: number;
  has_wiki?: boolean;
  has_projects?: boolean;
  forks_count?: number;
  watchers_count?: number;
  health_score?: number;
  recommendations?: string[];
}

interface Owner {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

function extractOwnerAndRepo(url: string): { ownerString: string; repo: string } | null {
  // Remove angle brackets if present
  url = url.replace(/^<|>$/g, '');

  // Enhanced regex to support more GitHub URL formats
  const githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\s#?]+)/i;
  
  const match = url.match(githubRegex);
  
  if (match && match.length === 3) {
    return {
      ownerString: match[1],
      repo: match[2].replace('.git', '') // Remove .git if present
    };
  }
  
  return null;
}


export const getRepoDetails = async (repositoryURL: string, octokit: Octokit): Promise<RepoDetails> => {
  try {
    const parsed = extractOwnerAndRepo(repositoryURL);
    if (!parsed) {
      throw new Error(`Invalid repository URL: ${repositoryURL}`);
    }
    const { ownerString, repo } = parsed;

    // Fix: Use 'owner' instead of 'ownerString' in the API request
    const response = await octokit.request('GET /repos/{owner}/{repo}', {
      owner: ownerString,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    // Calculate health score and recommendations
    const healthScore = calculateHealthScore(response.data);
    const recommendations = generateRecommendations(response.data);

    // Extract relevant information
    const repoDetails: RepoDetails = {
      name: response.data.name,
      full_name: response.data.full_name,
      owner: response.data.owner,
      html_url: response.data.html_url,
      description: response.data.description,
      created_at: response.data.created_at,
      updated_at: response.data.updated_at,
      homepage: response.data.homepage,
      language: response.data.language,
      default_branch: response.data.default_branch,
      open_issues_count: response.data.open_issues_count,
      has_wiki: response.data.has_wiki,
      has_projects: response.data.has_projects,
      forks_count: response.data.forks_count,
      watchers_count: response.data.watchers_count,
      health_score: healthScore,
      recommendations: recommendations
    }
    return repoDetails;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Repo details: ${error.message}`);
    }
    throw new Error('Failed to fetch Repo details: Unknown error');
  }
};

function calculateHealthScore(repoData: any): number {
  let score = 100;
  
  // Deduct points for no description
  if (!repoData.description) score -= 10;
  
  // Deduct points for high number of open issues
  if (repoData.open_issues_count > 50) score -= 15;
  
  // Add points for project features
  if (repoData.has_wiki) score += 5;
  if (repoData.has_projects) score += 5;
  
  // Add points for community engagement
  if (repoData.forks_count > 10) score += 10;
  if (repoData.watchers_count > 50) score += 10;

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(repoData: any): string[] {
  const recommendations: string[] = [];

  if (!repoData.description) {
    recommendations.push("📝 Add a repository description to help users understand your project");
  }
  
  if (!repoData.has_wiki && repoData.forks_count > 5) {
    recommendations.push("📚 Consider enabling Wiki for better documentation");
  }

  if (repoData.open_issues_count > 50) {
    recommendations.push("🐛 High number of open issues - Consider addressing them");
  }

  if (!repoData.has_projects) {
    recommendations.push("📋 Enable Projects feature for better task management");
  }

  return recommendations;
}

// Function to create a timeline comment with the Repo details
const createTimelineComment = async (partId: string, prDetails: RepoDetails, devrevSDK: publicSDK.Api<any>): Promise<void> => {
  try {
    const healthEmoji = (prDetails.health_score ?? 0) >= 80 ? "🟢" : 
                       (prDetails.health_score ?? 0) >= 60 ? "🟡" : "🔴";

    const bodyComment = `**Repository Health Check** ${healthEmoji}

**Basic Details:**
- Name: ${prDetails.name}
- Full Name: ${prDetails.full_name}
- Owner: ${prDetails.owner.login}
- Description: ${prDetails.description || 'No description provided'}
- Primary Language: ${prDetails.language || 'Not specified'}

**Health Metrics:**
- Repository Health Score: ${prDetails.health_score}/100
- Open Issues: ${prDetails.open_issues_count ?? 0}
- Forks: ${prDetails.forks_count ?? 0}
- Watchers: ${prDetails.watchers_count ?? 0}

**Recommendations:**
${prDetails.recommendations?.map(rec => `- ${rec}`).join('\n') || 'No recommendations at this time.'}

[View Repository](${prDetails.html_url})`;

    await devrevSDK.timelineEntriesCreate({
      body: bodyComment,
      object: partId,
      body_type: publicSDK.TimelineCommentBodyType.Text,
      type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
      visibility: publicSDK.TimelineEntryVisibility.Internal,
    });
  } catch (error) {
    throw new Error(`Failed to create timeline comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to handle the command event
const handleEvent = async (event: any) => {
  // Get the github token from the environment variables and initialise the Octokit client.
  const githubPAT = event.input_data.keyrings['github_connection'];
  const octokit = new Octokit({
    auth: githubPAT,
  });

  // Get the devrev token and initialise the DevRev SDK.
  const devrevToken = event.context.secrets['service_account_token'];
  const endpoint = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: endpoint,
    token: devrevToken,
  });

  // Retrieve the Part ID from the command event.
  const partId = event.payload['source_id'];

  // Get the command parameters from the event
  const repositoryURL: string = event.payload['parameters'];

  // Get the Repo details
  const prDetails = await getRepoDetails(repositoryURL, octokit);

  // Create a timeline comment with the Repo details  
  await createTimelineComment(partId, prDetails, devrevSDK);
};

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;