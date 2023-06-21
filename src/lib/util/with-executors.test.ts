import { AnyState } from 'xstate';
import { Executor, withExecutors } from './with-executors';
import { describe, expect, test, vi } from 'vitest';

class MockExecutor implements Executor {
  public exec = vi.fn();
}

describe('util', () => {
  describe('withExecutors', () => {
    test('executes all executors', async () => {
      const executors = [
        new MockExecutor(),
        new MockExecutor(),
        new MockExecutor()
      ];

      const onTransitionCallback = withExecutors(...executors);
      const state = {} as AnyState;

      await onTransitionCallback(state);

      for (const executor of executors) {
        expect(executor.exec).toHaveBeenCalledTimes(1);
        expect(executor.exec.mock.calls[0][0]).toBe(state);
      }
    });
  });
});