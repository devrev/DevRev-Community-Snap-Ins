import axios from "axios";
import { AxiosResponse } from "axios";
import { LLMUtils } from "./llm_utils";
import { client, betaSDK } from "@devrev/typescript-sdk";
import { IssueAnalyzerAgent, SolutionRecommenderAgent, SolutionVerifierAgent } from "./agents";

export interface Artifact {
  path: string;
  url: string;
  node_index: number;
  data: string;
}

export class JobArtifactAnalyzer {
  private readonly apiBaseUrl = "https://circleci.com/api/v2";
  public issueAnalyzerAgent: IssueAnalyzerAgent;
  public solutionRecommenderAgent: SolutionRecommenderAgent;
  public solutionVerifierAgent: SolutionVerifierAgent;

  constructor(
    private apiToken: string,
    private projectSlug: string,
    llmApiKey: string,
  ) {
    const llmUtils = new LLMUtils(llmApiKey, "mixtral-8x7b-32768", 4096);
    this.issueAnalyzerAgent = new IssueAnalyzerAgent(llmUtils);
    this.solutionRecommenderAgent = new SolutionRecommenderAgent(llmUtils);
    this.solutionVerifierAgent = new SolutionVerifierAgent(llmUtils);
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
      throw error;
    }
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

  constructor(endpoint: string, token: string) {
    this.devrevSdk = client.setupBeta({
      endpoint: endpoint,
      token: token,
    });
  }

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