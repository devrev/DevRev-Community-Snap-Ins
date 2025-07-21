import { client, publicSDK } from '@devrev/typescript-sdk';
import axios from 'axios';

const getUserCollectionsByApiKey = (postmanApiKey: string): Promise<any> => {
  const POSTMAN_API_URL = 'https://api.getpostman.com/collections';

  return new Promise((resolve, reject) => {
    axios
      .get(`${POSTMAN_API_URL}`, {
        headers: { 'X-Api-Key': postmanApiKey },
      })
      .then((response) => {
        if (!response.data?.collections) {
          return reject(new Error('Invalid response format from Postman API'));
        }
        resolve(response.data.collections);
      })
      .catch((error: unknown) => {
        const message = (error as any)?.message || 'An unknown error occurred';
        reject(new Error(`Failed to fetch collections: ${message}`));
      });
  });
};

export async function handleEvent(event: any) {
  const devrevPAT = event.context.secrets.service_account_token;
  const APIBase = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: APIBase,
    token: devrevPAT,
  });

  // console.log(event.input_data.keyrings.postman_access_token);
  const postmanApiKey = event.input_data.keyrings.postman_access_token;

  // Get the collections from Postman API
  try {
    const res = await getUserCollectionsByApiKey(postmanApiKey);
    const id_array = res.map((f: any) => {
      const data = {
        name: f.name,
        uid: f.uid,
      };

      return data;
    });

    // Get the work id from the event payload.
    const workId = event.payload.source_id;

    const timelineRequest: publicSDK.TimelineEntriesCreateRequest = {
      object: workId,
      type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
      visibility: publicSDK.TimelineEntryVisibility.Public,
      private_to: [],
      body: '```json\n' + JSON.stringify(id_array, null, 2) + '\n```',
    };

    const response = await devrevSDK.timelineEntriesCreate(timelineRequest);
    console.log(`Comment created for collections`);
    return response;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export const run = async (events: any[]) => {
  /*
  Put your code here to handle the event.
  */
  for (let event of events) {
    await handleEvent(event);
  }
};

export default run;
