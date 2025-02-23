/* eslint-disable @typescript-eslint/naming-convention */
import { client } from '@devrev/typescript-sdk';
import {
  TimelineCommentBodyType,
  TimelineEntriesCreateRequestType,
  TimelineEntryVisibility,
} from '@devrev/typescript-sdk/dist/auto-generated/public-devrev-sdk';

import CalComService from '../common/cal.service';
import { BOOKINGSNAPBODY } from '../common/constants';

// Handles the event from GitHub
async function cal_command_handler(event: any) {
  // Extract necessary information from the event

  console.log('command: ', JSON.stringify(event));

  // Return the response from the DevRev API

  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  // Setting up the DevRev SDK client
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  });

  const calsdk = CalComService('');

  const me = await calsdk.getMe();

  console.log('me', me);

  try {
    const data = await calsdk.getEventTypes(me.data.username);

    console.log('meeting data', data);
  } catch (e) {
    console.log('error', e);
  }

  try {
    const newTimelinWidgetOfcal = await devrevSDK.timelineEntriesCreate({
      body: event.payload.parameters,
      body_type: TimelineCommentBodyType.SnapKit,
      object: event.payload.source_id,
      snap_kit_body: {
        body: {
          snaps: [BOOKINGSNAPBODY],
        },
        snap_in_action_name: 'cal_widget',
        snap_in_id: event.context.snap_in_id,
      },
      type: TimelineEntriesCreateRequestType.TimelineComment,
      visibility: TimelineEntryVisibility.Public,
    });

    console.log('response', newTimelinWidgetOfcal);

    return newTimelinWidgetOfcal;
  } catch (e) {
    console.log('something went wrong', e);

    return '';
  }
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await cal_command_handler(event);
  }
};

export default run;
