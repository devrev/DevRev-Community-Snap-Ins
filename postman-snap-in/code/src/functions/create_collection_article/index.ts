import { DevRev, DevRevClient } from '@devrev/api';
import { client, publicSDK } from '@devrev/typescript-sdk';
import axios from 'axios';
import form_data from 'form-data';
import { OpenAI } from 'openai';
import showdown from 'showdown';
import { Readable } from 'stream';

const POSTMAN_API_URL = 'https://api.getpostman.com/collections';

async function generatePostmanDocumentation(openaiApiKey: string, collection: any): Promise<any> {
  const openai = new OpenAI({
    apiKey: openaiApiKey,
  });

  const prompt = `Given the following JSON response from the Postman API, create a detailed, well-structured, give proper end line charecter, proper control charecter and interactive documentation. Ensure it includes metadata, request details, expected responses, test scripts, and any potential issues or optimizations. The documentation should be easy to read and formatted for clarity.

JSON:
\`${JSON.stringify(collection, null, 2)}\``;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating documentation:', error);
    return 'Failed to generate documentation.';
  }
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

const uploadFile = async (
  url: string,
  formData: DevRev.ArtifactsPrepareResponseFormData[],
  fileContent: string
): Promise<any> => {
  const form = new form_data();
  for (const data of formData) {
    form.append(data.key, data.value);
  }
  const stream = new Readable();
  stream.push(fileContent);
  stream.push(null);
  form.append('file', stream, {
    filename: url,
    knownLength: stream.readableLength,
  });
  return axios.post(url, form);
};

export async function handleEvent(event: any) {
  const devrevPAT = event.context.secrets.service_account_token;
  const APIBase = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: APIBase,
    token: devrevPAT,
  });

  const appClient = new DevRevClient({
    token: '<your_devrev_token>',
  });

  const collectionUID = event.payload.parameters;
  const postmanApiKey = event.input_data.keyrings.postman_access_token;
  const openaiApiKey = event.input_data.keyrings.openai_access_token;

  const collectionObject = await getUserCollectionsByUID(postmanApiKey, collectionUID);
  const documentation = await generatePostmanDocumentation(openaiApiKey, collectionObject);

  try {
    const artifact_data: DevRev.ArtifactsPrepareRequest = {
      fileName: 'Article',
      fileType: 'devrev/rt',
    };
    const art_res = await appClient.artifacts.prepare(artifact_data);
    const { id: artifact_id, formData, url } = art_res;

    // const smallDoc = `# Postman Collection Documentation\n
    // # Overview

    // This document provides a thorough breakdown of the Postman collection retrieved via the Postman API using the collection UID. It covers details such as metadata, requests, test scripts, and expected responses.
    // `;

    const converter = new showdown.Converter();
    const converted_html = converter.makeHtml(documentation);

    const jsonStructure = JSON.stringify(
      {
        article: converted_html,
        artifactIds: [],
      },
      null,
      2
    );

    const res_up = await uploadFile(url, formData, jsonStructure);

    const res = await appClient.articles.createArticle({
      appliesToParts: ['FEAT-4'],
      ownedBy: ['DEVU-1'],
      resource: {
        artifacts: [art_res.id],
      },
      title: collectionObject.collection.info.name + ' Documentation',
      description: 'Documentation for the Postman collection for' + collectionObject.collection.info.name,
      articleType: 'article',
    });

    if (event.payload.surface === 'display:discussions') {
      const workId = event.payload.source_id;
      const timelineRequest: publicSDK.TimelineEntriesCreateRequest = {
        object: workId,
        type: publicSDK.TimelineEntriesCreateRequestType.TimelineComment,
        visibility: publicSDK.TimelineEntryVisibility.Public,
        private_to: [],
        body: `Article created for collection documentation.`,
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
