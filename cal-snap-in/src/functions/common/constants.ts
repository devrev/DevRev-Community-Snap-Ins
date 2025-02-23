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

export const BOOKINGSNAPBODY = {
  elements: [
    {
      direction: 'row',
      elements: [
        {
          action_id: 'booking_first',
          action_type: 'remote',
          style: 'primary',
          text: {
            text: 'Let Meet',
            type: 'plain_text',
          },
          type: 'button',
          value: 'first',
        },
        {
          action_id: 'booking_second',
          action_type: 'remote',
          style: 'primary',
          text: {
            text: 'Work together',
            type: 'plain_text',
          },
          type: 'button',
          value: 'second',
        },
        {
          action_id: 'booking_third',
          action_type: 'remote',
          style: 'primary',
          text: {
            text: 'Discuss together',
            type: 'plain_text',
          },
          type: 'button',
          value: 'third',
        },
      ],
      justify: 'center',
      type: 'actions',
    },
  ],
  title: {
    text: 'Select the booking type',
    type: 'plain_text',
  },
  type: 'card',
};

export const SCHEDULESNAPBODY = [
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
