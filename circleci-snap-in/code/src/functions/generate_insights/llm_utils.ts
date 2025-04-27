import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Custom parser to handle JSON parsing failures gracefully
class ResilientJsonOutputParser extends JsonOutputParser {
  override async parse(text: string): Promise<any> {
    try {
      // First try the standard parser
      return await super.parse(text);
    } catch (error) {
      console.warn("JSON parsing failed, attempting to fix malformed JSON:", error);
      
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          return JSON.parse(jsonMatch[1].trim());
        }
        
        // Try to extract anything that looks like a JSON object
        const possibleJson = text.match(/\{[\s\S]*\}/);
        if (possibleJson) {
          return JSON.parse(possibleJson[0]);
        }
        
        // Last resort: create mock response based on context
        console.warn("Could not extract valid JSON, returning fallback object");
        
        // Create a minimal fallback object with format matching expected output
        if (text.toLowerCase().includes("error")) {
          return { errors: [text.slice(0, 100)], warnings: [], summary: "Error detected" };
        }
        
        if (text.toLowerCase().includes("solution") || text.toLowerCase().includes("recommend")) {
          return [{ 
            issue: "Extracted from text", 
            recommendedSolution: text.slice(0, 200),
            confidenceLevel: "medium"
          }];
        }
        
        if (text.toLowerCase().includes("verify") || text.toLowerCase().includes("historical")) {
          return [{ 
            issue: "Extracted from text", 
            recommendedSolution: text.slice(0, 200),
            confidenceLevel: "medium",
            verificationStatus: "uncertain",
            historicalMatches: []
          }];
        }
        
        // Default fallback
        return { result: text.slice(0, 300) };
      } catch (fallbackError) {
        console.error("All JSON parsing attempts failed:", fallbackError);
        // Very minimal fallback
        return { error: "JSON parsing failed", text: text.slice(0, 100) };
      }
    }
  }
}

export class LLMUtils {
  private provider: BaseChatModel;

  constructor(apiKey: string, modelName: string, maxTokens: number) {
    try {
      this.provider = new ChatGroq({
        apiKey: apiKey || process.env['GROQ_API_KEY'] || "dummy-key-for-testing",
        modelName: modelName,
        maxTokens: maxTokens,
      });
    } catch (error) {
      console.error("Error initializing ChatGroq:", error);
      // Use a mock provider for testing if needed
      this.provider = this.createMockProvider();
    }
  }

  private createMockProvider(): BaseChatModel {
    // Simple mock that mimics the interface but returns mock data
    return {
      invoke: async () => {
        return { content: '{"result": "mock response for testing"}' };
      },
      // Add other required properties/methods to satisfy the interface
      _llmType: () => "mock",
      // @ts-ignore
      bind: () => this.createMockProvider()
    } as unknown as BaseChatModel;
  }

  async chatCompletion(
    sysPrompt: string,
    humanPrompt: string,
    argsValues: object,
  ): Promise<object> {
    try {
      // Add system prompt enhancement for better JSON formatting
      const enhancedPrompt = sysPrompt + 
        "\n\nIMPORTANT: Your response MUST be valid JSON only, no other text. Don't include any markdown formatting like ```json```.";
      
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(enhancedPrompt),
        HumanMessagePromptTemplate.fromTemplate(humanPrompt),
      ]);
      
      // Use resilient JSON parser that can handle parsing errors
      const outputParser = new ResilientJsonOutputParser();
      const chain = chatPrompt.pipe(this.provider).pipe(outputParser);
      
      const response = await chain.invoke(argsValues);
      return response;
    } catch (error) {
      console.error("Error in chatCompletion:", error);
      // Return fallback response that matches the expected structure based on prompt content
      if (sysPrompt.includes("CI/CD issue analyzer")) {
        return {
          errors: ["Error during analysis"],
          warnings: [],
          performanceIssues: [],
          securityConcerns: [],
          summary: "Failed to generate analysis due to an error."
        };
      } else if (sysPrompt.includes("solutions expert")) {
        return [{
          issue: "Error during recommendation generation",
          recommendedSolution: "Please try again with a more specific input.",
          confidenceLevel: "low"
        }];
      } else if (sysPrompt.includes("verifier")) {
        return [{
          issue: "Error during verification",
          recommendedSolution: "Please try again with a more specific input.",
          confidenceLevel: "low",
          verificationStatus: "uncertain",
          historicalMatches: []
        }];
      } else {
        return { error: "Failed to generate response", message: String(error).slice(0, 200) };
      }
    }
  }

  async textCompletion(sysPrompt: string, humanPrompt: string, argsValues: object): Promise<string> {
    try {
      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(sysPrompt),
        HumanMessagePromptTemplate.fromTemplate(humanPrompt),
      ]);
      const chain = chatPrompt.pipe(this.provider).pipe(new StringOutputParser());
      return await chain.invoke(argsValues);
    } catch (error) {
      console.error("Error in textCompletion:", error);
      return "Error generating text response: " + String(error).slice(0, 100);
    }
  }
}