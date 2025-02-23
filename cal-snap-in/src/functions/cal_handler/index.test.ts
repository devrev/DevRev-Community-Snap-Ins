import { testRunner } from '../../test-runner/test-runner';

describe('Example Index Test file', () => {
  it('Testing the method', () => {
    testRunner({
      fixturePath: 'cal_com.json',
      functionName: 'cal_handler',
    });
  });
});

