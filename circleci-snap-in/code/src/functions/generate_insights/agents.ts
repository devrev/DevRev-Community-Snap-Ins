import { LLMUtils } from "./llm_utils";
import { Artifact } from "./utils";


interface IssueAnalysis {
  errors: string[];
  warnings: string[];
  performanceIssues: string[];
  securityConcerns: string[];
  summary: string;
}
  
interface SolutionRecommendation {
  issue: string;
  recommendedSolution: string;
  confidenceLevel: 'low' | 'medium' | 'high';
}
  
interface VerifiedSolution extends SolutionRecommendation {
  verificationStatus: 'confirmed' | 'likely' | 'uncertain';
  historicalMatches?: string[];
}
  
export class IssueAnalyzerAgent {
  private llmUtils: LLMUtils;

  constructor(llmUtils: LLMUtils) {
    this.llmUtils = llmUtils;
  }

  async processArtifacts(artifacts: Artifact[]): Promise<IssueAnalysis> {
    const safeStringify = (data: any) => {
      try {
        return typeof data === "string" ? data : JSON.stringify(data);
      } catch {
        return "[Non-serializable data]";
      }
    };

    const combinedData = artifacts
      .map(artifact => `=== ${artifact.path} ===\n${safeStringify(artifact.data)}`)
      .join('\n\n');

    const systemPrompt = `You are an expert CI/CD issue analyzer. Your task is to:
1. Identify and extract error messages from build logs
2. Categorize issues into errors, warnings, performance issues, and security concerns
3. Provide a concise summary of the key problems

Return your analysis in JSON format with these fields:
- errors: string[]
- warnings: string[]
- performanceIssues: string[]
- securityConcerns: string[]
- summary: string`;

    const humanPrompt = `Analyze these build artifacts:
{input}`;

    const response = await this.llmUtils.chatCompletion(
      systemPrompt,
      humanPrompt,
      { input: combinedData }
    );

    return response as IssueAnalysis;
  }
}

export class SolutionRecommenderAgent {
  private llmUtils: LLMUtils;

  constructor(llmUtils: LLMUtils) {
    this.llmUtils = llmUtils;
  }

  async generateRecommendations(analysis: IssueAnalysis): Promise<SolutionRecommendation[]> {
    const systemPrompt = `You are a CI/CD solutions expert. Given a set of issues:
1. Provide actionable recommendations for each major issue
2. Include specific commands or configuration changes where applicable
3. Estimate your confidence level (low, medium, high) for each recommendation

Return an array of recommendations in JSON format with:
- issue: string
- recommendedSolution: string
- confidenceLevel: string`;

    const humanPrompt = `Analyze these CI/CD issues and provide solutions:
{input}`;

    const response = await this.llmUtils.chatCompletion(
      systemPrompt,
      humanPrompt,
      { input: JSON.stringify(analysis) }
    );

    return response as SolutionRecommendation[];
  }
}

export class SolutionVerifierAgent {
  private llmUtils: LLMUtils;
  private historicalSolutions: Record<string, string[]> = {
    "dependency error": ["Update package versions", "Clear cache and retry", "Check compatibility matrix"],
    "timeout": ["Increase timeout limit", "Optimize test suite", "Split into smaller jobs"],
    "memory issue": ["Increase resource allocation", "Optimize memory usage", "Enable swap space"]
  };

  constructor(llmUtils: LLMUtils) {
    this.llmUtils = llmUtils;
  }

  async verifySolutions(recommendations: SolutionRecommendation[]): Promise<VerifiedSolution[]> {
    const systemPrompt = `You are a CI/CD solution verifier. For each recommended solution:
1. Verify if it matches known patterns from historical data
2. Assess the likelihood of the solution being correct
3. Provide verification status (confirmed, likely, uncertain)
4. Include any matching historical solutions

Return verified solutions in JSON format with:
- issue: string
- recommendedSolution: string
- confidenceLevel: string
- verificationStatus: string
- historicalMatches?: string[]`;

    const humanPrompt = `Verify these recommended solutions against historical patterns:
{recommendations}

Known historical patterns:
{historicalData}`;

    const verifiedSolutions: VerifiedSolution[] = [];

    for (const recommendation of recommendations) {
      const response = await this.llmUtils.chatCompletion(
        systemPrompt,
        humanPrompt,
        {
          recommendations: JSON.stringify(recommendation),
          historicalData: JSON.stringify(this.historicalSolutions)
        }
      ) as VerifiedSolution;
      verifiedSolutions.push(response);
    }

    return verifiedSolutions;
  }
}
