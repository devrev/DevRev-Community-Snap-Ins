export const TODAY = 'today';
export const TOMORROW = 'tomorrow';
export const AFTERTOMORROW = 'aftertomorrow';

export const views = {
  //goes to schedule
  BOOKING: 'booking',

  //end
  CANCEL: 'cancel',

  //goes to reschedule or cancel
  RESCHEDULE: 'reschedule',

  //goes to reschedule
  SCHEDULE: 'schedule',
};

export const slots = ['15min', '30min', '45min', '60min'];

type SlotDuration = '15min' | '30min' | '45min' | '60min';

export const generateTimeSlots = (slotDuration: SlotDuration) => {
  const startTime = 12 * 60; // 12:00 PM in minutes
  const endTime = 17 * 60; // 5:00 PM in minutes

  const slotInMinutes = parseInt(slotDuration); // Convert '15min' -> 15

  const slotsArray: string[] = [];
  for (let time = startTime; time < endTime; time += slotInMinutes) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}`;
    slotsArray.push(formattedTime);
  }

  return slotsArray;
};

export const BOOKINGSNAPBODY = (data: any) => {
  const eventBtns = data.map((event: any) => ({
    action_id: `booking_${event.id}`,
    action_type: 'remote',
    style: 'primary',
    text: {
      text: event.title,
      type: 'plain_text',
    },
    type: 'button',
    value: 'first',
  }));

  return [
    {
      elements: [
        {
          direction: 'row',
          elements: eventBtns,
          justify: 'center',
          type: 'actions',
        },
      ],
      title: {
        text: 'Select the booking type',
        type: 'plain_text',
      },
      type: 'card',
    },
  ];
};

export const SCHEDULESNAPBODY = (slot: SlotDuration) => {
  const slotTime = generateTimeSlots(slot);

  const slotOptions = slotTime.map((el) => ({
    text: {
      text: el,
      type: 'plain_text',
    },
    value: el,
  }));

  return [
    {
      action_id: 'reschedule',
      action_type: 'remote',
      alignment: 'end',
      direction: 'row',
      elements: [
        {
          element: {
            action_id: 'single_static_select',
            initial_selected_option: {
              text: {
                text: 'Today',
                type: 'plain_text',
              },
              value: 'today',
            },
            options: [
              {
                text: {
                  text: 'Tomorrow',
                  type: 'plain_text',
                },
                value: 'tomorrow',
              },
              {
                text: {
                  text: 'Today',
                  type: 'plain_text',
                },
                value: 'today',
              },
              {
                text: {
                  text: 'Day After Tomorrow',
                  type: 'plain_text',
                },
                value: 'aftertomorrow',
              },
            ],
            placeholder: {
              text: 'Placeholder here',
              type: 'plain_text',
            },
            type: 'static_select',
          },
          label: {
            text: 'Select Day',
            type: 'plain_text',
          },
          type: 'input_layout',
        },
        {
          element: {
            action_id: 'slot_select',
            initial_selected_option: {
              text: {
                text: '12:00',
                type: 'plain_text',
              },
              value: '12:00',
            },
            options: slotOptions,
            placeholder: {
              text: ' Select Slot',
              type: 'plain_text',
            },
            type: 'static_select',
          },
          label: {
            text: 'Select Slot',
            type: 'plain_text',
          },
          type: 'input_layout',
        },
        {
          element: {
            action_id: 'user_picker',
            // action_type: 'remote',
            max_selected_items: 1,
            type: 'user_picker',
            user_types: ['dev_user'],
          },
          label: {
            text: 'User',
            type: 'plain_text',
          },
          type: 'input_layout',
        },
      ],
      justify: 'between',
      submit_action: {
        action_id: 'submit',
        style: 'primary',
        text: {
          text: 'Schedule',
          type: 'plain_text',
        },
        type: 'button',
        value: 'submit',
      },
      type: 'form',
    },
  ];
};

export const RESCHEDULESNAPBODY = [
  {
    elements: [
      {
        elements: [
          {
            text: 'Meeting is Schedule for Tomorrow at 12pm IST',
            type: 'plain_text',
          },
        ],
        type: 'content',
      },
      {
        alignment: 'end',
        direction: 'row',
        disable_on_action: true,
        elements: [
          {
            action_id: 'CANCEL',
            action_type: 'remote',
            style: 'destructive',
            text: {
              text: 'Cancel',
              type: 'plain_text',
            },
            type: 'button',
            value: 'button_3',
          },
          {
            action_id: 'schedule',
            action_type: 'remote',
            style: 'primary',
            text: {
              text: 'Reschedule',
              type: 'plain_text',
            },
            type: 'button',
            value: 'button_1',
          },
        ],
        justify: 'between',
        type: 'actions',
      },
    ],
    title: {
      text: 'Reschedule',
      type: 'plain_text',
    },
    type: 'card',
  },
];
