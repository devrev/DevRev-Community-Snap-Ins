# CircleCI Snap-in

Snap-in that syncs pipeline, workflow and jobs to DevRev using webhooks.
There is also a command to generate AI insights from the synced data. 
The insights are as follows:
Intelligent Build Failure Analysis (build_failure_analysis)
  1. Command pulls build logs from CircleCI.
  2. Analyze the logs to identify root causes, error messages, and potential solutions.
  3. AI agent posts a comment on the associated DevRev issue summarizing the analysis and suggesting troubleshooting steps.

### Concept Mapping:
1. CircleCI Project - DevRev Part
2. CircleCI Workflow - DevRev Issue (Each run of the workflow creates a timeline event)
3. CircleCI Job - DevRev Task

To run the command : 
```
/generateInsights jobId
```

## Requirements
1. CircleCI Account API Key
2. CircleCI Project Slug
3. Configuration of CircleCI Outbound Webhook [refer here](https://circleci.com/docs/webhooks/)

## Testing locally

Test the code by adding test events under `src/fixtures` similar to the example event provided. You can add [keyring](https://docs.devrev.ai/snap-ins/references/keyrings) values to the event payload to test API calls as well.

Run local tests using:

```
npm install
npm t
```

## Activating Snap-Ins

Once you are done with the testing, run the following commands to activate your snap_in:

1. Authenticate to devrev CLI
Navigate to the directory with ```manifest.yaml```
```
source .env
echo $DEVREV_TOKEN | devrev profiles set-token --org $DEV_ORG --usr $USER_EMAIL
```

2. Start test server
```
cd ./code
npm run test:server
```
Copy the url generated on replit.

3. Create a snap_in_version

```
devrev snap_in_package create-one --slug <slug_name>
devrev snap_in_version create-one --manifest ./manifest.yaml --testing-url <url>
```

4. Check if the Snap-In has activated
```
devrev snap_in_version show | jq
```

5. Install the Snap-In Draft
```
devrev snap_in draft | jq
```

6. Navigate to the URL returned by the last command on a web browser and setup the required keys.
