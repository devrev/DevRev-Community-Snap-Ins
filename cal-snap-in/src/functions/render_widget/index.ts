/*
 * Copyright (c) 2023 DevRev, Inc. All rights reserved.
 */
// Schedule call
// Reschedule call
// finally that the call has been cancelled

// get the slot for today, tomorrow, and after-tomorrow

import { client } from '@devrev/typescript-sdk';
import {
  TimelineCommentBodyType,
  TimelineEntriesUpdateRequestType,
} from '@devrev/typescript-sdk/dist/auto-generated/public-devrev-sdk';
import axios from 'axios';

import { RESCHEDULESNAPBODY, SCHEDULESNAPBODY, views } from '../common/constants';

export const run = async (events: any[]) => {
  console.log('Logging input events in render widget');
  for (const event of events) {
    console.log(event);
  }

  const event = events[0];

  const action = event.payload.action.id;

  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  // Setting up the DevRev SDK client
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  });

  console.log('Current action: ', action);

  console.log('after slots action: ', JSON.stringify(event));

  const isBooking = action.split('_')[0] === 'booking';

  if (isBooking) {
    // return the schedule snap body
    const updateTimelineEntryOnAction = await devrevSDK.timelineEntriesUpdate({
      body: event.payload.parameters,
      body_type: TimelineCommentBodyType.SnapKit,
      id: event.payload.context.entry_id,
      snap_kit_body: {
        body: {
          snaps: SCHEDULESNAPBODY('15min'),
        },
        snap_in_action_name: 'cal_widget',
        snap_in_id: event.context.snap_in_id,
      },
      type: TimelineEntriesUpdateRequestType.TimelineComment,
    });

    return updateTimelineEntryOnAction;
  }

  if (action === views.SCHEDULE) {
    const data = SCHEDULESNAPBODY('15min');

    console.log('slot', data);
    const updateTimelineEntryOnAction = await devrevSDK.timelineEntriesUpdate({
      body: event.payload.parameters,
      body_type: TimelineCommentBodyType.SnapKit,
      id: event.payload.context.entry_id,
      snap_kit_body: {
        body: {
          snaps: data,
        },
        snap_in_action_name: 'cal_widget',
        snap_in_id: event.context.snap_in_id,
      },
      type: TimelineEntriesUpdateRequestType.TimelineComment,
    });

    return updateTimelineEntryOnAction;
    // return the reschedule snap body again
  }

  if (action === views.RESCHEDULE) {
    //add api request here
    const API_URL = 'https://api.cal.com/v2/bookings';
    const API_TOKEN = 'cal_live_062aaa1387059dd9e1117a64477c9d37';

    const formValues = event.payload.action.value;

    const user = await devrevSDK.devUsersGet({
      id: formValues.user_picker.value[0],
    });

    const requestData = {
      attendee: {
        email: user.data.dev_user.email,
        name: user.data.dev_user.full_name,
        timeZone: 'Asia/Calcutta',
      },
      eventTypeId: 142572,
      start: '2025-02-26T06:30:00Z',
    };

    const response = await axios.post(API_URL, requestData, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'cal-api-version': '2024-08-13',
      },
    });

    // return the schedule snap body again
    const updateTimelineEntryOnAction = await devrevSDK.timelineEntriesUpdate({
      body: event.payload.parameters,
      body_type: TimelineCommentBodyType.SnapKit,
      id: event.payload.context.entry_id,
      snap_kit_body: {
        body: {
          snaps: RESCHEDULESNAPBODY,
        },
        snap_in_action_name: 'cal_widget',
        snap_in_id: event.context.snap_in_id,
      },
      type: TimelineEntriesUpdateRequestType.TimelineComment,
    });

    return updateTimelineEntryOnAction;
  }

  const updateTimelineEntryOnAction = await devrevSDK.timelineEntriesUpdate({
    body: event.payload.parameters,
    body_type: TimelineCommentBodyType.SnapKit,
    id: event.payload.context.entry_id,
    snap_kit_body: {
      body: {
        snaps: [
          {
            elements: [
              {
                text: `you clicked the action ${action}`,
                type: 'plain_text',
              },
            ],
            type: 'content',
          },
        ],
      },
      snap_in_action_name: 'cal_widget',
      snap_in_id: event.context.snap_in_id,
    },
    type: TimelineEntriesUpdateRequestType.TimelineComment,
  });

  return updateTimelineEntryOnAction;
};

export default run;
