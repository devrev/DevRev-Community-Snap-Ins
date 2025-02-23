import axios from "axios";
import { AxiosResponse } from "axios";
import { LLMUtils } from "./llm_utils";
import { client, betaSDK } from "@devrev/typescript-sdk";

interface Artifact {
  path: string;
  url: string;
  node_index: number;
  data: string;
}

export class JobArtifactAnalyzer {
  private readonly apiBaseUrl = "https://circleci.com/api/v2";
  private llmUtils: LLMUtils;

  constructor(
    private apiToken: string,
    private projectSlug: string,
    llmApiKey: string,
  ) {
    this.llmUtils = new LLMUtils(llmApiKey, "mixtral-8x7b-32768", 4096);
  }

  async fetchJobArtifacts(jobId: string): Promise<Artifact[]> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/project/${encodeURIComponent(this.projectSlug)}/${jobId}/artifacts`,
        {
          headers: {
            "Circle-Token": this.apiToken,
            Accept: "application/json",
          },
        },
      );

      const artifacts = await Promise.all(
        response.data.items.map(async (item: any) => {
          const artifactResponse = await axios.get(item.url);
          const dataString = artifactResponse.data;
          return {
            path: item.path,
            url: item.url,
            node_index: item.node_index,
            data: dataString,
          };
        }),
      );
      return artifacts;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `API request failed: ${error.response?.status} ${error.response?.data}`,
        );
      }
    }

    return [];
  }

  async generateInsights(data: any): Promise<string> {
    const systemPrompt = `Analyze CI/CD artifacts to identify:
1. Test failures or errors
2. Performance metrics
3. Security warnings
4. Build configuration issues
Present findings in markdown with severity levels.`;

    const humanPrompt = `Artifact metadata is provided.
Generate analysis summary.
Metadata:`;

    const response = await this.llmUtils.chatCompletion(
      systemPrompt,
      humanPrompt,
      data,
    );

    return JSON.stringify(response, null, 2);
  }
}

export type HTTPResponse = {
  success: boolean;
  message: string;
  data: any;
};

export const defaultResponse: HTTPResponse = {
  data: {},
  message: "",
  success: false,
};

export class ApiUtils {
  public devrevSdk!: betaSDK.Api<HTTPResponse>;

  // Constructor to initialize SDK instances
  constructor(endpoint: string, token: string) {
    this.devrevSdk = client.setupBeta({
      endpoint: endpoint,
      token: token,
    });
  }

  // Create a timeline entry for a CircleCI step
  async createTimeLine(
    payload: betaSDK.TimelineEntriesCreateRequest,
  ): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse =
        await this.devrevSdk.timelineEntriesCreate(payload);
      return {
        data: response.data,
        message: "Timeline entry created successfully",
        success: true,
      };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to create timeline entry. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }

  // Update a timeline entry
  async updateTimeLine(
    payload: betaSDK.TimelineEntriesUpdateRequest,
  ): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse =
        await this.devrevSdk.timelineEntriesUpdate(payload);
      return {
        data: response.data,
        message: "Timeline updated successfully",
        success: true,
      };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to update timeline. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }
}
