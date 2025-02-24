import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { FunctionFactoryType } from './function-factory';
import { testRunner } from './test-runner/test-runner';

(async () => {
  try {
    const argv = await yargs(hideBin(process.argv))
      .options({
        fixturePath: {
          require: true,
          type: 'string',
          description: 'Path to the test fixture file',
        },
        functionName: {
          require: true,
          type: 'string',
          description: 'Name of the function to test (e.g., command_handler)',
          choices: ['command_handler'] as FunctionFactoryType[],
        },
      })
      .strict() // Report errors for unknown arguments
      .help() // Enable --help
      .version() // Enable --version
      .argv;

    // Validate arguments
    if (!argv.fixturePath || !argv.functionName) {
      throw new Error('Missing required arguments: fixturePath & functionName must be provided');
    }

    console.log(`Starting test runner with:
    - Fixture: ${argv.fixturePath}
    - Function: ${argv.functionName}`);

    await testRunner({
      fixturePath: argv.fixturePath,
      functionName: argv.functionName as FunctionFactoryType,
    });

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error running tests:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1); // Exit with error code
  }
})();
