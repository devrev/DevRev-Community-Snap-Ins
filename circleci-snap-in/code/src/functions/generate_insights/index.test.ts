import { testRunner } from "../../test-runner/test-runner";
import { LLMUtils } from "./llm_utils";
import { IssueAnalyzerAgent, SolutionRecommenderAgent, SolutionVerifierAgent, IssueAnalysis, SolutionRecommendation, VerifiedSolution } from "./agents";
import { Artifact } from "./utils";
import * as dotenv from "dotenv";
import { ApiUtils } from "../sync_circleci_data/utils";

// Mock modules
jest.mock("axios");
jest.mock("./llm_utils");
dotenv.config();

// Also mock the ApiUtils for generate_insights
jest.mock("../sync_circleci_data/utils", () => {
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

interface Evaluation {
  analysisQuality: number;
  recommendationQuality: number;
  verificationAccuracy: number;
  overallScore: number;
  feedback: string;
}

describe("Generate Insights Function", () => {
  it("Main function execution", async () => {
    await testRunner({
      fixturePath: "generate_insights_test.json",
      functionName: "generate_insights",
    });
  });
});

describe("IssueAnalyzerAgent Tests", () => {
  let llmUtils: jest.Mocked<LLMUtils>;
  let agent: IssueAnalyzerAgent;
  
  beforeEach(() => {
    // Create mock instance
    const apiKey = process.env['GROQ_API_KEY'] || "test-api-key";
    const model = "llama-3.1-8b-instant";
    llmUtils = new LLMUtils(apiKey, model, 10000) as jest.Mocked<LLMUtils>;
    agent = new IssueAnalyzerAgent(llmUtils);
  });

  it("should process artifacts correctly with error logs", async () => {
    // Mock test data
    const testArtifacts: Artifact[] = [
      {
        path: "build.log",
        url: "http://example.com/build.log",
        node_index: 0,
        data: "Error: Failed to install dependencies\nnpm ERR! code ENOENT\nnpm ERR! syscall spawn git\nnpm ERR! path git\nnpm ERR! errno -2\nnpm ERR! enoent Error while executing git\nnpm ERR! enoent This is related to npm not being able to find a file."
      }
    ];

    // Mock expected response
    const mockAnalysis: IssueAnalysis = {
      errors: ["Failed to install dependencies", "Error while executing git"],
      warnings: [],
      performanceIssues: [],
      securityConcerns: [],
      summary: "The build is failing due to Git-related dependency installation issues."
    };

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockAnalysis);

    // Execute the function
    const result = await agent.processArtifacts(testArtifacts);

    // Verify LLM was called with correct parameters
    expect(llmUtils.chatCompletion).toHaveBeenCalledWith(
      expect.stringContaining("You are an expert CI/CD issue analyzer"),
      expect.stringContaining("Analyze these build artifacts"),
      expect.objectContaining({ input: expect.any(String) })
    );

    // Verify the output
    expect(result).toEqual(mockAnalysis);
    expect(result.errors).toContain("Failed to install dependencies");
    expect(result.errors).toContain("Error while executing git");
    expect(result.summary).toContain("Git-related dependency installation issues");
  });

  it("should handle timeout issues in build logs", async () => {
    // Mock test data for timeout issues
    const testArtifacts: Artifact[] = [
      {
        path: "test.log",
        url: "http://example.com/test.log",
        node_index: 0,
        data: "Error: Test timed out after 60000 milliseconds\nTimeout - Async callback was not invoked within the 60000 ms timeout\nTest suite failed to run"
      }
    ];

    // Mock expected response
    const mockAnalysis: IssueAnalysis = {
      errors: ["Test timed out after 60000 milliseconds"],
      warnings: ["Async callback was not invoked within timeout"],
      performanceIssues: ["Tests are taking too long to execute"],
      securityConcerns: [],
      summary: "Tests are failing due to timeout issues, which may indicate performance problems."
    };

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockAnalysis);

    // Execute the function
    const result = await agent.processArtifacts(testArtifacts);

    // Verify the output
    expect(result).toEqual(mockAnalysis);
    expect(result.errors).toContain("Test timed out after 60000 milliseconds");
    expect(result.performanceIssues).toContain("Tests are taking too long to execute");
  });

  it("should handle memory-related issues", async () => {
    // Mock test data for memory issues
    const testArtifacts: Artifact[] = [
      {
        path: "memory.log",
        url: "http://example.com/memory.log",
        node_index: 0,
        data: "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\n<--- JS stacktrace --->\nError: ENOMEM: not enough memory"
      }
    ];

    // Mock expected response
    const mockAnalysis: IssueAnalysis = {
      errors: ["JavaScript heap out of memory", "ENOMEM: not enough memory"],
      warnings: [],
      performanceIssues: ["Ineffective mark-compacts near heap limit"],
      securityConcerns: [],
      summary: "The build is failing due to memory limitations, causing JavaScript heap out of memory errors."
    };

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockAnalysis);

    // Execute the function
    const result = await agent.processArtifacts(testArtifacts);

    // Verify the output
    expect(result).toEqual(mockAnalysis);
    expect(result.errors).toContain("JavaScript heap out of memory");
    expect(result.performanceIssues).toContain("Ineffective mark-compacts near heap limit");
  });
});

describe("SolutionRecommenderAgent Tests", () => {
  let llmUtils: jest.Mocked<LLMUtils>;
  let agent: SolutionRecommenderAgent;
  
  beforeEach(() => {
    const apiKey = process.env['GROQ_API_KEY'] || "test-api-key";
    const model = "llama-3.1-8b-instant";
    llmUtils = new LLMUtils(apiKey, model, 10000) as jest.Mocked<LLMUtils>;
    agent = new SolutionRecommenderAgent(llmUtils);
  });

  it("should generate recommendations for dependency issues", async () => {
    // Mock input analysis
    const issueAnalysis: IssueAnalysis = {
      errors: ["Failed to install dependencies", "Error while executing git"],
      warnings: [],
      performanceIssues: [],
      securityConcerns: [],
      summary: "The build is failing due to Git-related dependency installation issues."
    };

    // Mock expected recommendations
    const mockRecommendations: SolutionRecommendation[] = [
      {
        issue: "Failed to install dependencies due to Git errors",
        recommendedSolution: "Ensure Git is properly installed in the CI environment. Add steps to install Git: `apt-get update && apt-get install -y git`",
        confidenceLevel: "high"
      },
      {
        issue: "npm dependency installation errors",
        recommendedSolution: "Update npm configuration to use HTTPS instead of SSH for Git repository access",
        confidenceLevel: "medium"
      }
    ];

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockRecommendations);

    // Execute the function
    const result = await agent.generateRecommendations(issueAnalysis);

    console.debug("Generated recommendations:", result);

    // Verify LLM was called with correct parameters
    expect(llmUtils.chatCompletion).toHaveBeenCalledWith(
      expect.stringContaining("You are a CI/CD solutions expert"),
      expect.stringContaining("Analyze these CI/CD issues and provide solutions"),
      expect.objectContaining({ input: expect.any(String) })
    );

    // Verify the output
    expect(result).toEqual(mockRecommendations);
    expect(result[0].issue).toContain("Failed to install dependencies");
    expect(result[0].recommendedSolution).toContain("Ensure Git is properly installed");
    expect(result[0].confidenceLevel).toBe("high");
  });

  it("should generate recommendations for timeout issues", async () => {
    // Mock input analysis for timeout issues
    const issueAnalysis: IssueAnalysis = {
      errors: ["Test timed out after 60000 milliseconds"],
      warnings: ["Async callback was not invoked within timeout"],
      performanceIssues: ["Tests are taking too long to execute"],
      securityConcerns: [],
      summary: "Tests are failing due to timeout issues, which may indicate performance problems."
    };

    // Mock expected recommendations
    const mockRecommendations: SolutionRecommendation[] = [
      {
        issue: "Test timeout issues",
        recommendedSolution: "Increase the test timeout in Jest configuration: `jest.setTimeout(120000)`",
        confidenceLevel: "high"
      },
      {
        issue: "Slow test execution",
        recommendedSolution: "Optimize test parallelization with `--maxWorkers=4` flag or consider splitting the test suite into smaller jobs",
        confidenceLevel: "medium"
      }
    ];

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockRecommendations);

    // Execute the function
    const result = await agent.generateRecommendations(issueAnalysis);

    // Verify the output
    expect(result).toEqual(mockRecommendations);
    expect(result[0].issue).toContain("Test timeout issues");
    expect(result[0].recommendedSolution).toContain("Increase the test timeout");
  });
});

describe("SolutionVerifierAgent Tests", () => {
  let llmUtils: jest.Mocked<LLMUtils>;
  let agent: SolutionVerifierAgent;
  
  beforeEach(() => {
    const apiKey = process.env['GROQ_API_KEY'] || "test-api-key";
    const model = "llama-3.1-8b-instant";
    llmUtils = new LLMUtils(apiKey, model, 10000) as jest.Mocked<LLMUtils>;
    agent = new SolutionVerifierAgent(llmUtils);
  });

  it("should verify solutions against historical patterns", async () => {
    // Mock input recommendations
    const recommendations: SolutionRecommendation[] = [
      {
        issue: "Test timeout issues",
        recommendedSolution: "Increase the test timeout in Jest configuration",
        confidenceLevel: "high"
      }
    ];

    // Mock verified solution
    const mockVerifiedSolution: VerifiedSolution = {
      issue: "Test timeout issues",
      recommendedSolution: "Increase the test timeout in Jest configuration",
      confidenceLevel: "high",
      verificationStatus: "confirmed",
      historicalMatches: ["Increase timeout limit", "Split into smaller jobs"]
    };

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockVerifiedSolution);

    // Execute the function
    const result = await agent.verifySolutions(recommendations);

    // Verify LLM was called with correct parameters
    expect(llmUtils.chatCompletion).toHaveBeenCalledWith(
      expect.stringContaining("You are a CI/CD solution verifier"),
      expect.stringContaining("Verify these recommended solutions against historical patterns"),
      expect.objectContaining({ 
        recommendations: expect.any(String),
        historicalData: expect.any(String)
      })
    );

    // Verify the output
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockVerifiedSolution);
    expect(result[0].verificationStatus).toBe("confirmed");
    expect(result[0].historicalMatches).toContain("Increase timeout limit");
  });

  it("should verify memory issue solutions with uncertainty", async () => {
    // Mock input recommendations
    const recommendations: SolutionRecommendation[] = [
      {
        issue: "JavaScript heap out of memory",
        recommendedSolution: "Increase Node.js memory allocation with --max-old-space-size=4096",
        confidenceLevel: "medium"
      }
    ];

    // Mock verified solution
    const mockVerifiedSolution: VerifiedSolution = {
      issue: "JavaScript heap out of memory",
      recommendedSolution: "Increase Node.js memory allocation with --max-old-space-size=4096",
      confidenceLevel: "medium",
      verificationStatus: "likely",
      historicalMatches: ["Increase resource allocation"]
    };

    // Mock the LLM response
    llmUtils.chatCompletion = jest.fn().mockResolvedValue(mockVerifiedSolution);

    // Execute the function
    const result = await agent.verifySolutions(recommendations);

    // Verify the output
    expect(result).toHaveLength(1);
    expect(result[0].verificationStatus).toBe("likely");
    expect(result[0].historicalMatches).toContain("Increase resource allocation");
  });
});

describe("LLM as Judge Test", () => {
  let llmUtils: jest.Mocked<LLMUtils>;
  
  beforeEach(() => {
    llmUtils = new LLMUtils("test-api-key", "test-model", 1000) as jest.Mocked<LLMUtils>;
  });

  it("should evaluate the quality of agent outputs", async () => {
    // Mock artifacts data
    const testArtifacts: Artifact[] = [
      {
        path: "complex.log",
        url: "http://example.com/complex.log",
        node_index: 0,
        data: `
ERROR: Failed to compile.
./src/components/Header.tsx
Module not found: Can't resolve '@material-ui/core' in '/app/src/components'
ERROR in ./src/components/Header.tsx
Module not found: Can't resolve '@material-ui/core' in '/app/src/components'
1 | import React from 'react';
2 | import { AppBar, Toolbar, Typography } from '@material-ui/core';
  |                                           ^
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! test-app@0.1.0 build: 'react-scripts build'
npm ERR! Exit status 1`
      }
    ];

    // Create real agents with mocked LLM
    const issueAnalyzerAgent = new IssueAnalyzerAgent(llmUtils);
    const solutionRecommenderAgent = new SolutionRecommenderAgent(llmUtils);
    const solutionVerifierAgent = new SolutionVerifierAgent(llmUtils);

    // Mock analysis response
    const mockAnalysis: IssueAnalysis = {
      errors: ["Module not found: Can't resolve '@material-ui/core'", "npm ERR! code ELIFECYCLE", "npm ERR! Exit status 1"],
      warnings: [],
      performanceIssues: [],
      securityConcerns: [],
      summary: "The build is failing because the @material-ui/core dependency is missing or not correctly installed."
    };

    // Mock recommendations
    const mockRecommendations: SolutionRecommendation[] = [
      {
        issue: "Missing @material-ui/core dependency",
        recommendedSolution: "Install the missing dependency: `npm install @material-ui/core`",
        confidenceLevel: "high"
      }
    ];

    // Mock verification
    const mockVerification: VerifiedSolution[] = [
      {
        issue: "Missing @material-ui/core dependency",
        recommendedSolution: "Install the missing dependency: `npm install @material-ui/core`",
        confidenceLevel: "high",
        verificationStatus: "confirmed",
        historicalMatches: ["Update package versions"]
      }
    ];

    // Mock judge evaluation
    const mockJudgeEvaluation: Evaluation = {
      analysisQuality: 9,
      recommendationQuality: 10,
      verificationAccuracy: 8,
      overallScore: 9,
      feedback: "The analysis correctly identified the missing dependency. The recommendation is straightforward and effective. The verification correctly matched with historical patterns."
    };

    // Setup mock responses in sequence
    llmUtils.chatCompletion
      .mockResolvedValueOnce(mockAnalysis)
      .mockResolvedValueOnce(mockRecommendations)
      .mockResolvedValueOnce(mockVerification[0])
      .mockResolvedValueOnce(mockJudgeEvaluation);

    // Process artifacts through the agent pipeline
    const issueAnalysis = await issueAnalyzerAgent.processArtifacts(testArtifacts);
    const recommendations = await solutionRecommenderAgent.generateRecommendations(issueAnalysis);
    const verifiedSolutions = await solutionVerifierAgent.verifySolutions(recommendations);

    // Simulate LLM as judge evaluation
    const judgePrompt = `You are an expert evaluator of CI/CD problem solving. 
    Rate the quality of the following analysis, recommendations, and verifications on a scale of 1-10.
    
    Artifact data: ${JSON.stringify(testArtifacts)}
    
    Issue Analysis: ${JSON.stringify(issueAnalysis)}
    
    Recommendations: ${JSON.stringify(recommendations)}
    
    Verified Solutions: ${JSON.stringify(verifiedSolutions)}
    
    Provide ratings and feedback in this JSON format:
    {
      "analysisQuality": number,
      "recommendationQuality": number,
      "verificationAccuracy": number,
      "overallScore": number,
      "feedback": string
    }`;

    // Execute the judge evaluation
    const evaluation = await llmUtils.chatCompletion(
      "You are an expert CI/CD evaluator",
      judgePrompt,
      {}
    );

    // Since we're mocking the response, we can just use the mock directly
    const parsedEvaluation = evaluation as Evaluation;

    // Verify judge evaluation was called
    expect(llmUtils.chatCompletion).toHaveBeenCalledTimes(4);
    
    // Verify evaluation content
    expect(parsedEvaluation).toEqual(mockJudgeEvaluation);
    expect(parsedEvaluation.overallScore).toBeGreaterThanOrEqual(7);
  });
});