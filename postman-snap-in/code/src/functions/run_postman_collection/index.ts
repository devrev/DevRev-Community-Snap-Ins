import { client, publicSDK } from '@devrev/typescript-sdk';
import { WorkType } from '@devrev/typescript-sdk/dist/auto-generated/public-devrev-sdk';
import axios from 'axios';
import newman from 'newman';
import { OpenAI } from 'openai';

const POSTMAN_API_URL = 'https://api.getpostman.com/collections';

async function generateErrorDescription(openaiApiKey: string, errorObject: any) {
  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  const prompt = `
    Given the following error object from a Postman collection run, generate a concise and clear summary explaining the issue, expected behavior, received response, and possible causes.
    
    Error Object:
    ${JSON.stringify(errorObject, null, 2)}

    Provide a structured summary including:
    - Error type
    - Expected vs actual outcome
    - Request details (method, URL)
    - Possible reasons for failure
    - Next steps to resolve it
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content?.trim() || 'Failed to generate description.';
}

const getUserCollectionsByUID = async (apiKey: string, collectionUID: string): Promise<any> => {
  try {
    const response = await axios.get(`${POSTMAN_API_URL}/${collectionUID}`, {
      headers: { 'X-Api-Key': apiKey },
    });

    if (!response.data || !response.data.collection) {
      throw new Error('Invalid response format from Postman API');
    }

    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to fetch collection: ${error.message}`);
  }
};

const runCollection = async (postmanApiKey: string, openaiApiKey: string, collectionUID: string): Promise<any[]> => {
  try {
    const data = await getUserCollectionsByUID(postmanApiKey, collectionUID);

    return new Promise((resolve, reject) => {
      newman
        .run({ collection: data.collection })
        .on('start', () => console.log('Running the collection...'))
        .on('done', async (err: any, summary: any) => {
          if (err || summary.error) {
            console.error('Collection run encountered an error.');
            return reject(err || summary.error);
          }

          const failures = await Promise.all(
            summary.run.failures.map(async (f: any) => ({
              name: `${f.error.name} | ${f.source.name}`,
              error: f.error.message,
              description: await generateErrorDescription(openaiApiKey, f.error), // Fixed typo
            }))
          );

          console.log('Collection run completed.');
          resolve(failures);
        });
    });
  } catch (error) {
    console.error('Error fetching collection data:', error);
    throw error;
  }
};

export async function handleEvent(event: any) {
  const devrevPAT = event.context.secrets.service_account_token;
  const APIBase = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: APIBase,
    token: devrevPAT,
  });

  const collectionUID = event.payload.parameters;
  const postmanApiKey = event.input_data.keyrings.postman_access_token;
  const openaiApiKey = event.input_data.keyrings.openai_access_token;

  try {
    const failures = await runCollection(postmanApiKey, openaiApiKey, collectionUID);

    await Promise.all(
      failures.map(async (f) => {
        const WorksCreateRequest: publicSDK.WorksCreateRequest = {
          type: WorkType.Issue,
          applies_to_part: 'FEAT-4',
          owned_by: ['DEVU-1'],
          title: f.name,
          body: f.description,
        };

        const response = await devrevSDK.worksCreate(WorksCreateRequest);
        return response;
      })
    );

    console.log(event.payload.surface);

    if (event.payload.surface === 'display:discussions') {
      const workId = event.payload.source_id;

      const timelineRequest: publicSDK.TimelineEntriesCreateRequest = {
        object: workId,
        type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: publicSDK.TimelineEntryVisibility.Public,
        private_to: [],
        body: `Collection run completed. ${failures.length} issues were created.`,
      };

      const response = await devrevSDK.timelineEntriesCreate(timelineRequest);

      console.log(`Comment created for collection run`);
    }
  } catch (error) {
    console.error('Error handling event:', error);
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
