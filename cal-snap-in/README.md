### Cal.com+ DevRev

The integration between Cal.com and DevRev aims to create a seamless scheduling experience that enhances developer productivity and collaboration. By linking Cal.com’s powerful scheduling capabilities with DevRev’s product management and support workflows, this integration will allow teams to automatically reflect their calendar events, such as bookings, cancellations, and reschedules, within the DevRev timeline and product parts.
This proposal outlines the key mappings, integration mechanics, core features, and API interactions required to build a robust Cal.com snap-in for DevRev.



Create a command that would add the cal.com in the discussions of ticket and issues

// A widget which can setup meeting with the Organiser

// Command -> TimelineEntry -> Widget -> Schedule 
// Reschedule -> 
// Cancel -> 



// Syncing with DevRev internal gateway api

https://app.devrev.ai/api/gateway/internal/meetings.create


## Snap-in triggered by an external source: GitHub

Snap-in that adds a comment to the discussions tab of any part, which is configurable, from a GitHub push or commit event.

### Testing locally
You can test your code by adding test events under `src/fixtures` similar to the example event provided. You can add keyring values to the event payload to test API calls as well.

Once you have added the event, you can test your code by running:
```
npm install
npm run start -- --functionName=github_handler --fixturePath=github_event.json
```

### Adding external dependencies
You can add dependencies on external packages in package.json under the “dependencies” key. These dependencies will be made available to your function at runtime and testing.

### Linting

To check for lint errors, run the following command:

```bash
npm run lint
```

To automatically fix fixable lint errors, run:

```bash
npm run lint:fix
```

### Activating snap-ins
Once you are done with the testing, run the following commands to activate your snap-in:

1. Authenticate to devrev CLI
```
devrev profiles authenticate --org <devorg name> --usr <user email>
```
2. Create a snap_in_version
```
devrev snap_in_version create-one --path <template path> --create-package
```
3. Draft the snap_in
```
devrev snap_in draft
```
4. Update the snap_in
```
devrev snap_in update
```
5. Activate the snap_in
```
devrev snap_in activate
```