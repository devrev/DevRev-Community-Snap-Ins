import { testRunner } from '../../test-runner/test-runner';

describe('GitHub Repository Health Check Tests', () => {
  it('should handle valid GitHub repository URL', () => {
    testRunner({
      fixturePath: 'on_command_valid_repo.json',
      functionName: 'command_handler',
    });
  });

  it('should handle invalid GitHub repository URL', () => {
    testRunner({
      fixturePath: 'on_command_invalid_repo.json',
      functionName: 'command_handler',
    });
  });

  it('should handle repository with no description', () => {
    testRunner({
      fixturePath: 'on_command_no_description.json',
      functionName: 'command_handler',
    });
  });

  it('should handle rate limiting errors', () => {
    testRunner({
      fixturePath: 'on_command_rate_limit.json',
      functionName: 'command_handler',
    });
  });
});
