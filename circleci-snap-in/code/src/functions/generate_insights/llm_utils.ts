import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";

type Provider = "OpenAI" | "Groq";

export class LLMUtils {
  private provider: ChatOpenAI | ChatGroq;

  constructor(
    apiKey: string,
    modelName: string,
    maxTokens: number,
    mode: Provider,
  ) {
    if (mode === "OpenAI") {
      this.provider = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        maxTokens: maxTokens,
      });
    } else {
      this.provider = new ChatGroq({
        apiKey: apiKey,
        modelName: modelName,
        maxTokens: maxTokens,
      });
    }
  }

  async chatCompletion(
    sysPrompt: string,
    humanPrompt: string,
    argsValues: object,
  ): Promise<object> {
    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(sysPrompt),
      HumanMessagePromptTemplate.fromTemplate(humanPrompt),
    ]);
    const outputParser = new JsonOutputParser();
    const chain = chatPrompt.pipe(this.provider).pipe(outputParser);
    const response = await chain.invoke(argsValues);
    return response;
  }
}
