function generateTableJson(columns: string[], rows: { [x: string]: any }[]) {
  return {
    elements: [
      {
        columns: columns.map((col: string) => ({
          header: {
            text: col,
            type: 'plain_text',
          },
          key: col.toLowerCase().replace(/\s+/g, '_'),
        })),
        rows: rows.map((row: { [x: string]: any }) => {
          const formattedRow: { [key: string]: { text: any; type: string } } = {};
          for (const key in row) {
            formattedRow[key.toLowerCase().replace(/\s+/g, '_')] = {
              text: row[key],
              type: 'plain_text',
            };
          }
          return formattedRow;
        }),
        type: 'table',
      },
    ],
  };
}

// reschedule
const snapBody = (input: any) => ({
  snap_kit_body: {
    body: {
      snaps: [
        {
          elements: [
            {
              direction: 'row',
              elements: [
                {
                  action_id: 'send',
                  action_type: 'remote',
                  style: 'primary',
                  text: {
                    text: 'Send',
                    type: 'plain_text',
                  },
                  type: 'button',
                  value: 'send',
                },
                {
                  action_id: 'shuffle',
                  action_type: 'remote',
                  style: 'primary',
                  text: {
                    text: 'Shuffle',
                    type: 'plain_text',
                  },
                  type: 'button',
                  value: 'shuffle',
                },
                {
                  action_id: 'cancel',
                  action_type: 'remote',
                  style: 'danger',
                  text: {
                    text: 'Cancel',
                    type: 'plain_text',
                  },
                  type: 'button',
                  value: 'cancel',
                },
              ],
              justify: 'center',
              type: 'actions',
            },
          ],
          title: {
            text: input.payload.parameters,
            type: 'plain_text',
          },
          type: 'card',
        },
      ],
    },
    snap_in_action_name: 'giphy',
    snap_in_id: input.context.snap_in_id,
  },
  type: 'timeline_comment',
});

const RescheduleView = (event: any) => ({
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
          action_id: 'RESCHEDULE',
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
    text: event.payload.parameters,
    type: 'plain_text',
  },
  type: 'card',
});

const FormExample = (event: any) => ({
  action_id: 'user_form',
  elements: [
    {
      element: {
        action_id: 'name',
        action_type: 'remote',
        min_length: 10,
        placeholder: {
          text: 'Enter your name',
          type: 'plain_text',
        },
        type: 'plain_text_input',
      },
      hint: {
        text: 'Please enter your name',
        type: 'plain_text',
      },
      label: {
        text: 'User name',
        type: 'plain_text',
      },
      optional: true,
      type: 'input_layout',
    },
    {
      element: {
        action_id: 'age',
        max_value: 120,
        min_value: 10,
        type: 'number_input',
      },
      label: {
        text: 'Age',
        type: 'plain_text',
      },
      type: 'input_layout',
    },
    {
      element: {
        action_id: 'checkboxes',
        options: [
          {
            description: {
              text: 'Description for option 1',
              type: 'plain_text',
            },
            text: {
              text: 'Option 1',
              type: 'plain_text',
            },
            value: 'option_1',
          },
          {
            description: {
              text: 'Description for option 1',
              type: 'plain_text',
            },
            text: {
              text: 'Option 2',
              type: 'plain_text',
            },
            value: 'option_2',
          },
        ],
        type: 'checkboxes',
      },
      type: 'input_layout',
    },
    {
      element: {
        action_id: 'radio_buttons',
        options: [
          {
            description: {
              text: 'Description for option 1',
              type: 'plain_text',
            },
            text: {
              text: 'Radio option 1',
              type: 'plain_text',
            },
            value: 'radio_option_1',
          },
          {
            description: {
              text: 'Description for option 1',
              type: 'plain_text',
            },
            text: {
              text: 'Radio option 2',
              type: 'plain_text',
            },
            value: 'radio_option_2',
          },
        ],
        type: 'radio_buttons',
      },
      type: 'input_layout',
    },
    {
      element: {
        action_id: 'multi_static_select',
        options: [
          {
            text: {
              text: 'Select option 1',
              type: 'plain_text',
            },
            value: 'select-option-1',
          },
          {
            text: {
              text: 'Select option 2',
              type: 'plain_text',
            },
            value: 'select-option-2',
          },
        ],
        type: 'multi_static_select',
      },
      label: {
        text: 'Multi select',
        type: 'plain_text',
      },
      type: 'input_layout',
    },
    {
      element: {
        action_id: 'single_static_select',
        initial_selected_option: {
          text: {
            text: 'Single 1',
            type: 'plain_text',
          },
          value: 'single-option-1',
        },
        options: [
          {
            text: {
              text: 'Single 1',
              type: 'plain_text',
            },
            value: 'single-option-1',
          },
          {
            text: {
              text: 'Single 2',
              type: 'plain_text',
            },
            value: 'single-option-2',
          },
        ],
        placeholder: {
          text: 'Placeholder here',
          type: 'plain_text',
        },
        type: 'static_select',
      },
      label: {
        text: 'Single select',
        type: 'plain_text',
      },
      type: 'input_layout',
    },
  ],
  submit_action: {
    action_id: 'submit',
    style: 'primary',
    text: {
      text: 'Submit',
      type: 'plain_text',
    },
    type: 'button',
    value: 'submit',
  },
  type: 'form',
});

const ExpandableCard = (event: any) => ({
  default_collapsed: true,
  elements: [
    {
      elements: [
        {
          text: ' # Hello this is an example of a collapsible card \n this is better',
          type: 'rich_text',
        },
      ],
      type: 'content',
    },
  ],
  is_collapsible: true,
  title: {
    text: 'Collapsible card example',
    type: 'plain_text',
  },
  type: 'card',
});
