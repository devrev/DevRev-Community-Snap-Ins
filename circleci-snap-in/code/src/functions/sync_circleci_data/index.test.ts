import { testRunner } from "../../test-runner/test-runner";
import { ApiUtils } from "./utils";

// Mock the API Utils to prevent real API calls during tests
jest.mock("./utils", () => {
  return {
    ApiUtils: jest.fn().mockImplementation(() => {
      return {
        getParts: jest.fn().mockResolvedValue({
          success: true,
          data: { parts: [] },
          message: "Mocked parts response"
        }),
        createPart: jest.fn().mockResolvedValue({
          success: true,
          data: { part: { id: "PART-123" } },
          message: "Part created successfully"
        }),
        getWorks: jest.fn().mockResolvedValue({
          success: true,
          data: { works: [] },
          message: "Mocked works response"
        }),
        createWork: jest.fn().mockResolvedValue({
          success: true,
          data: { work: { id: "WORK-123" } },
          message: "Work created successfully"
        }),
        createTimeLine: jest.fn().mockResolvedValue({
          success: true,
          data: {},
          message: "Timeline created successfully"
        })
      };
    })
  };
});

describe("Webhook of type-1 (workflow-completed for GitHub OAuth and Bitbucket Cloud)", () => {
  it("Testing the method", async () => {
    await testRunner({
      fixturePath: "type1.json",
      functionName: "sync_circleci_data",
    });
  });
});

describe("Webhook of type-2 (job-completed for GitHub OAuth and Bitbucket Cloud)", () => {
  it("Testing the method", async () => {
    await testRunner({
      fixturePath: "type2.json",
      functionName: "sync_circleci_data",
    });
  });
});

describe("Webhook of type-3 (workflow-completed for GitLab, GitHub App and Bitbucket Data Center)", () => {
  it("Testing the method", async () => {
    await testRunner({
      fixturePath: "type3.json",
      functionName: "sync_circleci_data",
    });
  });
});

describe("Webhook of type-4 (job-completed for GitLab, GitHub App and Bitbucket Data Center)", () => {
  it("Testing the method", async () => {
    await testRunner({
      fixturePath: "type4.json",
      functionName: "sync_circleci_data",
    });
  });
});
