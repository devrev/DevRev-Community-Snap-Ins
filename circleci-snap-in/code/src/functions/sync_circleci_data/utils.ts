import { client, betaSDK } from "@devrev/typescript-sdk";
import { AxiosResponse } from "axios";

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

  // Create an Issue/Task
  async createIssueOrTask(
    payload: betaSDK.WorksCreateRequest,
  ): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse = await this.devrevSdk.worksCreate(payload);
      return {
        data: response.data,
        message: "Ticket created successfully",
        success: true,
      };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to create ticket. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }

  // TODO: handle the scenario where part is already created
  async createPart(
    payload: betaSDK.PartsCreateRequest,
  ): Promise<HTTPResponse> {
    try {
      const response: AxiosResponse = await this.devrevSdk.partsCreate(payload);
      return {
        data: response.data,
        message: "Part created successfully",
        success: true,
      };
    } catch (error: any) {
      if (error.response) {
        const err = `Failed to create part. Err: ${JSON.stringify(error.response.data)}, Status: ${
          error.response.status
        }`;
        return { ...defaultResponse, message: err };
      } else {
        return { ...defaultResponse, message: error.message };
      }
    }
  }
}
