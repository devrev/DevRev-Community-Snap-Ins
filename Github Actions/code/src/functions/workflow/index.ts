import axios from "axios";

const GITHUB_API_BASE = "https://api.github.com";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const createHeaders = (token: string) => ({
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json",
});

const createOpenAIHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const helpText = `\`\`\`
Usage: /workflow <command> <repo> <owner> [additional parameters...] [--summary]

Available Commands:

WORKFLOWS:
  list <repo> <owner>                     - List repository workflows
  get <repo> <owner> <workflow_id>        - Get workflow details
  disable <repo> <owner> <workflow_id>    - Disable a workflow
  enable <repo> <owner> <workflow_id>     - Enable a workflow
  dispatch <repo> <owner> <workflow_id>   - Trigger workflow dispatch event
  usage <repo> <owner> <workflow_id>      - Get workflow usage

WORKFLOW RUNS:
  runs-list <repo> <owner>                - List workflow runs for a repository
  run-get <repo> <owner> <run_id>         - Get a workflow run
  run-delete <repo> <owner> <run_id>      - Delete a workflow run
  run-reviews <repo> <owner> <run_id>     - Get review history
  run-approve <repo> <owner> <run_id>     - Approve a fork pull request
  run-logs <repo> <owner> <run_id>        - Download run logs
  run-cancel <repo> <owner> <run_id>      - Cancel a workflow run
  run-force-cancel <repo> <owner> <run_id> - Force cancel a workflow run
  run-rerun <repo> <owner> <run_id>       - Re-run a workflow
  run-rerun-failed <repo> <owner> <run_id> - Re-run failed jobs
  run-usage <repo> <owner> <run_id>       - Get run usage
  run-deployments <repo> <owner> <run_id> - List pending deployments
  run-deployment-rules <repo> <owner> <run_id> - Review custom deployment rules
  run-review-deployments <repo> <owner> <run_id> - Review pending deployments

WORKFLOW JOBS:
  job-get <repo> <owner> <run_id> <job_id> - Get a job for a workflow run
  job-logs <repo> <owner> <run_id> <job_id> - Download job logs
  jobs-list <repo> <owner> <run_id>         - List jobs for a workflow run
  jobs-attempt <repo> <owner> <run_id> <attempt_number> - List jobs for a workflow run attempt

Examples:
  /workflow list react facebook
  /workflow run-get react facebook 12345
  /workflow job-logs react facebook 12345 67890
  /workflow list react facebook --summary

Use "/workflow help" to see this message
\`\`\``;

interface BaseParams {
  repo: string;
  owner: string;
}

interface WorkflowParams extends BaseParams {
  workflow_id?: string;
}

interface RunParams extends BaseParams {
  run_id: string;
}

interface JobParams extends RunParams {
  job_id?: string;
  attempt_number?: string;
}

type CommandParams = WorkflowParams | RunParams | JobParams;

async function postResponse(baseURL: string, workId: string, token: string, message: string): Promise<void> {
  await axios.post(
    `${baseURL}/timeline-entries.create`,
    {
      type: "timeline_comment",
      object: workId,
      body: message,
      visibility: "external"
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function handleWorkflowCommands(command: string, params: WorkflowParams, token: string): Promise<any> {
  const { repo, owner, workflow_id } = params;
  const baseUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/workflows`;

  switch (command) {
    case 'list':
      return axios.get(baseUrl, { headers: createHeaders(token) });
    case 'get':
      return axios.get(`${baseUrl}/${workflow_id}`, { headers: createHeaders(token) });
    case 'disable':
      return axios.put(`${baseUrl}/${workflow_id}/disable`, {}, { headers: createHeaders(token) });
    case 'enable':
      return axios.put(`${baseUrl}/${workflow_id}/enable`, {}, { headers: createHeaders(token) });
    case 'dispatch':
      return axios.post(`${baseUrl}/${workflow_id}/dispatches`, { ref: 'main' }, { headers: createHeaders(token) });
    case 'usage':
      return axios.get(`${baseUrl}/${workflow_id}/timing`, { headers: createHeaders(token) });
    default:
      throw new Error(`Unknown workflow command: ${command}`);
  }
}

async function handleRunCommands(command: string, params: RunParams, token: string): Promise<any> {
  const { repo, owner, run_id } = params;
  const baseUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/runs`;

  switch (command) {
    case 'runs-list':
      return axios.get(baseUrl, { headers: createHeaders(token) });
    case 'run-get':
      return axios.get(`${baseUrl}/${run_id}`, { headers: createHeaders(token) });
    case 'run-delete':
      return axios.delete(`${baseUrl}/${run_id}`, { headers: createHeaders(token) });
    case 'run-reviews':
      return axios.get(`${baseUrl}/${run_id}/reviews`, { headers: createHeaders(token) });
    case 'run-approve':
      return axios.post(`${baseUrl}/${run_id}/approve`, {}, { headers: createHeaders(token) });
    case 'run-logs':
      return axios.get(`${baseUrl}/${run_id}/logs`, { headers: createHeaders(token) });
    case 'run-cancel':
      return axios.post(`${baseUrl}/${run_id}/cancel`, {}, { headers: createHeaders(token) });
    case 'run-force-cancel':
      return axios.post(`${baseUrl}/${run_id}/force-cancel`, {}, { headers: createHeaders(token) });
    case 'run-rerun':
      return axios.post(`${baseUrl}/${run_id}/rerun`, {}, { headers: createHeaders(token) });
    case 'run-rerun-failed':
      return axios.post(`${baseUrl}/${run_id}/rerun-failed-jobs`, {}, { headers: createHeaders(token) });
    case 'run-usage':
      return axios.get(`${baseUrl}/${run_id}/timing`, { headers: createHeaders(token) });
    case 'run-deployments':
      return axios.get(`${baseUrl}/${run_id}/pending_deployments`, { headers: createHeaders(token) });
    case 'run-deployment-rules':
      return axios.get(`${baseUrl}/${run_id}/deployment_protection_rules`, { headers: createHeaders(token) });
    case 'run-review-deployments':
      return axios.get(`${baseUrl}/${run_id}/pending_deployments`, { headers: createHeaders(token) });
    default:
      throw new Error(`Unknown run command: ${command}`);
  }
}

async function handleJobCommands(command: string, params: JobParams, token: string): Promise<any> {
  const { repo, owner, run_id, job_id, attempt_number } = params;
  const baseUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions`;

  switch (command) {
    case 'job-get':
      return axios.get(`${baseUrl}/jobs/${job_id}`, { headers: createHeaders(token) });
    case 'job-logs':
      return axios.get(`${baseUrl}/jobs/${job_id}/logs`, { headers: createHeaders(token) });
    case 'jobs-list':
      return axios.get(`${baseUrl}/runs/${run_id}/jobs`, { headers: createHeaders(token) });
    case 'jobs-attempt':
      return axios.get(`${baseUrl}/runs/${run_id}/attempts/${attempt_number}/jobs`, { headers: createHeaders(token) });
    default:
      throw new Error(`Unknown job command: ${command}`);
  }
}

async function summarizeWithOpenAI(openaiToken: string, content: string): Promise<string> {
  const response = await axios.post(
    OPENAI_API_URL,
    {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes text." },
        { role: "user", content: `Please summarize the following content in 3 sentences:\n${content}` }
      ],
      max_tokens: 150
    },
    { headers: createOpenAIHeaders(openaiToken) }
  );

  return response.data.choices[0].message.content;
}

function parseInput(input: string): { command: string; params: CommandParams; summaryFlag: boolean } | "help" | null {
  const args = input.trim().split(/\s+/);

  if (args[0] === "help" || args.length === 0) {
    return "help";
  }

  const command = args[0];
  const repo = args[1];
  const owner = args[2];
  const summaryFlag = args.includes('--summary');

  if (!command || !repo || !owner) {
    return null;
  }

  const baseParams: BaseParams = { repo, owner };

  switch (command) {
    case 'job-get':
    case 'job-logs':
      if (args.length < 5) return null;
      return {
        command,
        params: {
          ...baseParams,
          run_id: args[3],
          job_id: args[4]
        } as JobParams,
        summaryFlag
      };
    case 'jobs-list':
      if (args.length < 4) return null;
      return {
        command,
        params: {
          ...baseParams,
          run_id: args[3]
        } as JobParams,
        summaryFlag
      };
    case 'jobs-attempt':
      if (args.length < 5) return null;
      return {
        command,
        params: {
          ...baseParams,
          run_id: args[3],
          attempt_number: args[4]
        } as JobParams,
        summaryFlag
      };
    case 'runs-list':
      return {
        command,
        params: baseParams as RunParams,
        summaryFlag
      };
    case 'run-get':
    case 'run-delete':
    case 'run-reviews':
    case 'run-approve':
    case 'run-logs':
    case 'run-cancel':
    case 'run-force-cancel':
    case 'run-rerun':
    case 'run-rerun-failed':
    case 'run-usage':
    case 'run-deployments':
    case 'run-deployment-rules':
    case 'run-review-deployments':
      if (args.length < 4) return null;
      return {
        command,
        params: {
          ...baseParams,
          run_id: args[3]
        } as RunParams,
        summaryFlag
      };
    case 'list':
      return {
        command,
        params: baseParams as WorkflowParams,
        summaryFlag
      };
    case 'get':
    case 'disable':
    case 'enable':
    case 'dispatch':
    case 'usage':
      if (args.length < 4) return null;
      return {
        command,
        params: {
          ...baseParams,
          workflow_id: args[3]
        } as WorkflowParams,
        summaryFlag
      };
    default:
      return null;
  }
}

export default async function workflow(event: any[]): Promise<void> {
  const workId = event[0].payload.source_id;
  const baseURL = event[0].execution_metadata.devrev_endpoint;
  const { service_account_token } = event[0].context.secrets;
  const githubToken = event[0].input_data.keyrings.github_api_key;
  const openaiToken = event[0].input_data.keyrings.openai_api_key;

  try {
    const userInput = event[0].payload.parameters || "";
    const parsed = parseInput(userInput);

    if (parsed === "help") {
      await postResponse(baseURL, workId, service_account_token, helpText);
      return;
    }

    if (!parsed) {
      await postResponse(baseURL, workId, service_account_token,
        "Invalid input format. Use '/workflow help' to see usage instructions.");
      return;
    }

    let response;
    try {
      if (parsed.command.startsWith('job-') || parsed.command === 'jobs-attempt') {
        response = await handleJobCommands(parsed.command, parsed.params as JobParams, githubToken);
      } else if (parsed.command.startsWith('run-') || parsed.command === 'runs-list') {
        response = await handleRunCommands(parsed.command, parsed.params as RunParams, githubToken);
      } else {
        response = await handleWorkflowCommands(parsed.command, parsed.params as WorkflowParams, githubToken);
      }
    } catch (error: any) {
      const errorMessage = error.response?.status === 401
        ? "Error: Invalid or expired GitHub token"
        : `Error executing command: ${error.message}`;

      await postResponse(baseURL, workId, service_account_token, errorMessage);
      return;
    }

    const content = JSON.stringify(response.data, null, 2);
    const message = parsed.summaryFlag
      ? await summarizeWithOpenAI(openaiToken, content)
      : `Command Result:\n\`\`\`json\n${content}\n\`\`\``;

    await postResponse(baseURL, workId, service_account_token, message);

  } catch (error: any) {
    const errorMessage = error.response?.status === 401
      ? "Error: Invalid or expired GitHub token"
      : `Error executing command: ${error.message}`;

    await postResponse(baseURL, workId, service_account_token, errorMessage);
  }
}
