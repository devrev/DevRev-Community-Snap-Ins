import axios from 'axios';
import { convertToJson, makeAPICall, processPRDiff } from '../utils/utils';

interface APIResponse {
  success: boolean;
  errMessage: string;
  data: any;
}

async function getPRDiff(githubToken: string, owner: string, repo: string, prNumber: number): Promise<any> {
  const response = await axios.request({
    url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3.diff'
    }
  });
  return response.data;
}

async function getAIReview(prDiff: string, openaiApiKey: string): Promise<APIResponse> {
  const processedDiff = processPRDiff(prDiff);

  const reviewPrompt = {
    model: "gpt-4-turbo-preview",
    messages: [{
      role: "user",
      content: `Review this PR diff and provide specific feedback for problematic lines. Format your response as a JSON array of objects, where each object has:
      - line_number: the line number (found at the start of each line before the | character)
      - comment: your specific feedback for that line
      - path: the file path (found in the diff headers)
      Only include entries where you have concrete suggestions or concerns.
      
      Note: Each code line starts with a line number followed by | character. Use these line numbers in your response.
      Output: {comments: [{....}, {....}]}
      
      PR diff:\n\n${processedDiff}`
    }],
    temperature: 0.7,
    response_format: { type: "json_object" }
  };

  const response = await makeAPICall(
    'https://api.openai.com/v1/chat/completions',
    reviewPrompt,
    `Bearer ${openaiApiKey}`,
    'POST'
  );
  return response;
}


async function createPullRequestReview(
  githubToken: string, 
  owner: string, 
  repo: string, 
  prNumber: number, 
  comments: Array<{ line_number: number, comment: string, path: string }>
): Promise<APIResponse> {
  try {
    const prResponse = await axios.request({
      url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const commitId = prResponse.data.head.sha;
    
    try {
      const response = await axios.request({
        url: `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        data: {
          commit_id: commitId,
          event: 'COMMENT',
          comments: comments.map(comment => ({
            path: comment.path,
            line: comment.line_number,
            body: comment.comment
          }))
        }
      });

      return {
        success: true,
        errMessage: '',
        data: {
          successful: comments,
          failed: []
        }
      };
    } catch (error) {
      console.error('Failed to post review:', error);
      return {
        success: false,
        errMessage: String(error),
        data: {
          successful: [],
          failed: comments.map(comment => ({
            comment,
            error: String(error)
          }))
        }
      };
    }
  } catch (error: any) {
    console.error('GitHub API error:', error);
    return { success: false, errMessage: String(error), data: '' };
  }
}

async function maybeUpdateIssueTitle(prDiff: any, issueId: any, devrevToken: any, devrevApiEndpoint: any, openaiApiKey: any) {
  if(!issueId) {
    return;
  }

  try {
    const titleDescriptionPrompt = {
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "user",
        content: `Generate a title and description for the issue based on the following PR diff: ${prDiff}
        Give a short title and a detailed description of the issue in JSON format.
        Output: {title: "...", description: "..."}`
      }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }

    const openaiResponse = await makeAPICall(
      'https://api.openai.com/v1/chat/completions',
      titleDescriptionPrompt,
      `Bearer ${openaiApiKey}`,
      'POST'
    );

    const titleDescription = JSON.parse(openaiResponse.data.choices[0].message.content);
    const title = titleDescription.title;
    const description = titleDescription.description;

    const issueUpdate = {
      title: title,
      body: description,
      id: issueId,
      type: "issue"
    }

    await makeAPICall(
      `${devrevApiEndpoint}/works.update`,
      issueUpdate,
      `Bearer ${devrevToken}`,
      'POST'
    );
  } catch (error) {
    console.error('Error updating issue title:', error);
  }
}


async function handleEvent(event: any): Promise<APIResponse | void> {
  const parsedEvent: any = convertToJson(event.payload.payload[0]);

  if (Object.keys(parsedEvent).length === 0) {
    console.log('Event is empty');
    return;
  }

  if (parsedEvent.action !== "opened") {
    return;
  }

  const issueIdRegex = /(ISS-\d+)/;
  const issueIdMatch = parsedEvent.pull_request?.body?.match(issueIdRegex);
  const issueId = issueIdMatch ? issueIdMatch[1] : null;

  const githubToken = event.input_data.keyrings.github;
  const devrevToken = event.context.secrets.service_account_token;
  const devrevApiEndpoint = event.execution_metadata.devrev_endpoint;
  const openaiApiKey = event.input_data.keyrings.openai;

  const [owner, repo] = parsedEvent.repository.full_name.split('/');
  const prNumber = parsedEvent.pull_request.number;

  try {
    const prDiff = await getPRDiff(githubToken, owner, repo, prNumber);
    await maybeUpdateIssueTitle(prDiff, issueId, devrevToken, devrevApiEndpoint, openaiApiKey);
    const reviewResponse = await getAIReview(prDiff, openaiApiKey);
    
    if (!reviewResponse.success) {
      return reviewResponse;
    }

    let comments = JSON.parse(reviewResponse.data.choices[0].message.content);
    if (!Array.isArray(comments.comments)) {
      comments = comments.comments || [];
    } else if ("comments" in comments) {
      comments = comments.comments;
    } else {
      comments = [];
    }

    const commentResponse = await createPullRequestReview(
      githubToken,
      owner,
      repo,
      prNumber,
      comments
    );

    if (!commentResponse.success) {
      console.error('Failed to post review comments:', commentResponse.errMessage);
    } else {
      console.log('Review comments posted successfully');
    }

    return commentResponse;
  } catch (error) {
    console.error('Error processing PR:', error);
    return { success: false, errMessage: String(error), data: '' };
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;

