# Notify Owner on Ticket to Product Assist

## Overview

This snap-in automatically notifies part owners when a ticket transitions to the "Product Assist" stage in DevRev. It ensures that relevant stakeholders are immediately aware when tickets require product team attention.

## Functionality

### Trigger

The snap-in activates when:

- A ticket's stage changes to "awaiting_product_assist"
- Only triggers if the ticket wasn't previously in this stage

### Notification Logic

The snap-in follows two notification patterns based on part ownership:

1. **Single Bot Owner**

   - If the part has only one owner and it's a bot
   - Message: "Hey, this ticket moved to Product Assist stage and may need attention."

2. **Human Owner(s)**
   - If the part has one or more human owners
   - Message: "Hey @owner1, @owner2, this ticket moved to Product Assist stage and may need your attention. You are being notified because you are the part owner of this ticket."
   - All human owners are mentioned (@mentioned) in the notification

### Implementation Details

- Creates a timeline entry on the ticket with the notification
- Mentions all relevant part owners (if human users)
- Logs a message if no part owners are found (no notification created)

## Technical Details

### Dependencies

- Node.js
- TypeScript
- DevRev API utilities
- Axios for API calls
- sprintf-js for string formatting

### Project Structure

```
/code
  /src
    /functions
      /ticket_stage_change    # Main function logic
    /fixtures                 # Test fixtures
  /dist                      # Compiled code
  package.json               # Dependencies and scripts
```

### Key Files

- `src/functions/ticket_stage_change/index.ts`: Main function logic
- `src/functions/ticket_stage_change/utils/devrev-utils.ts`: DevRev API utilities
- `src/fixtures/status_change.json`: Test event fixture

### Development

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Test locally:

```bash
npm run start:watch -- --functionName=ticket_stage_update --fixturePath=status_change.json
```

4. Package for deployment:

```bash
npm run package
```

## Use Cases

- Ensuring product owners don't miss tickets that need their attention
- Maintaining clear communication channels between support and product teams
- Automating the notification process for product assistance requests

## Requirements

- The ticket must be associated with a part
- The part should ideally have assigned owners
- DevRev service account token with appropriate permissions
