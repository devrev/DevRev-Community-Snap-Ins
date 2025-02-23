import { testRunner } from "../../test-runner/test-runner";

describe("Webhook of type-1 (workflow-completed for GitHub OAuth and Bitbucket Cloud)", () => {
  it("Testing the method", () => {
    testRunner({
      fixturePath: "type1.json",
      functionName: "sync_circleci_data",
    });
  });
});

describe("Webhook of type-2 (job-completed for GitHub OAuth and Bitbucket Cloud)", () => {
  it("Testing the method", () => {
    testRunner({
      fixturePath: "type2.json",
      functionName: "sync_circleci_data",
    });
  });
});

describe("Webhook of type-3 (workflow-completed for GitLab, GitHub App and Bitbucket Data Center)", () => {
  it("Testing the method", () => {
    testRunner({
      fixturePath: "type3.json",
      functionName: "sync_circleci_data",
    });
  });
});

describe("Webhook of type-4 (job-completed for GitLab, GitHub App and Bitbucket Data Center)", () => {
  it("Testing the method", () => {
    testRunner({
      fixturePath: "type4.json",
      functionName: "sync_circleci_data",
    });
  });
});
