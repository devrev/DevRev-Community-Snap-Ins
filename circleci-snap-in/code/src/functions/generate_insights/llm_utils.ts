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

export class LLMUtils {
  private provider: ChatGroq;

  constructor(apiKey: string, modelName: string, maxTokens: number) {
    this.provider = new ChatGroq({
      apiKey: apiKey,
      modelName: modelName,
      maxTokens: maxTokens,
    });
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

  async textCompletion(sysPrompt: string, humanPrompt: string, argsValues: object): Promise<string> {
    const chatPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(sysPrompt),
      HumanMessagePromptTemplate.fromTemplate(humanPrompt),
    ]);
    const chain = chatPrompt.pipe(this.provider).pipe(new StringOutputParser());
    return await chain.invoke(argsValues);
  }
}