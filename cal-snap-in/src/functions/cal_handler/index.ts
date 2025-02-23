import { client } from '@devrev/typescript-sdk';
import { MeetingChannel, MeetingState } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';

type Attendee = {
  name: string;
  email: string;
  timeZone: string;
  phoneNumber: string | null;
};

// Handles the event from GitHub
async function handleEvent(event: any) {
  // Extract necessary information from the event

  console.log('event payload from cal.com', JSON.stringify(event));

  const token = event.context.secrets.service_account_token;
  const endpoint = event.execution_metadata.devrev_endpoint;

  // Set up the DevRev SDK with the extracted information
  // const devrevSDK = client.setup({
  //   endpoint: endpoint,
  //   token: token,
  // });

  // get both the people from webhook organiser.email -> our dev user
  // attendees.forEach((person) => person.email))  -> rev user
  // if both user are invalid, get the admin
  // add custom

  const betaDevRevSDK = client.setupBeta({
    endpoint: endpoint,
    token: token,
  });

  // Extract the part ID and commits from the event
  const meetingdata = event.payload.payload;

  // create a new account
  const newAccount = await betaDevRevSDK.revUsersCreate({
    display_name: meetingdata?.attendees[0].name,
    email: meetingdata?.attendees[0].email,
  });

  const users = await betaDevRevSDK.devUsersList({
    email: [meetingdata?.attendees[0]?.email, meetingdata?.organizer.email],
  });

  console.log('users', users.data.dev_users);

  console.log('newAccount', newAccount);

  const meetingType = {
    BOOKING_CANCELLED: MeetingState.Canceled,
    BOOKING_CREATED: MeetingState.Scheduled,
    BOOKING_RESCHEDULED: MeetingState.Rescheduled,
  };

  const meetingState = meetingType[event.payload.triggerEvent as keyof typeof meetingType];

  // Create a new Meeting
  const newMeeting = await betaDevRevSDK.meetingsCreate({
    channel: MeetingChannel.Other,
    // custom_fields: {
    //   cal_id: meetingdata?.uid || ' ',
    //   timeZone: meetingdata?.organizer?.timeZone || ' ',
    // },
    description: meetingdata?.additionalNotes || '',
    ended_date: meetingdata?.endTime,
    external_ref: `https://cal.com/${meetingdata.uid}`,

    external_url: `https://cal.com/${meetingdata.uid}`,

    members: [newAccount.data.rev_user.id],
    recording_url: meetingdata.metadata.videoCallUrl,
    scheduled_date: meetingdata.startTime,
    state: meetingState as any,
    title: meetingdata.title || 'new Meet',
  });

  console.log('newMeeting', newMeeting);

  // Return the response from the DevRev API
  return newMeeting;
}

export const run = async (events: any[]) => {
  for (const event of events) {
    await handleEvent(event);
  }
};

export default run;
