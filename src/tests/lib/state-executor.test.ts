import { describe, test, expect, vi } from "vitest";
import { StateExecFn, StateExecutor } from "@/lib";
import { AnyState } from "xstate";

const options: Record<string, StateExecFn> = {
  'parent': vi.fn(),
  'parent.child': vi.fn(),
};

describe("StateExecutor", () => {
  describe('constructor', () => {
    test('creates a StateExecutor with options', () => {
      const executor = new StateExecutor(options);
      expect(executor).toBeDefined();
    });

    test('creates a StateExecutor with empty options', () => {
      const executor = new StateExecutor({});
      expect(executor).toBeDefined();
    });

    test('creates a StateExecutor with no options', () => {
      const executor = new StateExecutor();
      expect(executor).toBeDefined();
    });
  });

  describe('exec', () => {
    const executor = new StateExecutor(options);

    test('does nothing for unknown states', async () => {
      const state = { toStrings: () => ['UNKNOWN'] } as AnyState;

      await executor.exec(state);

      expect(options['parent']).not.toHaveBeenCalled();
      expect(options['parent.child']).not.toHaveBeenCalled();
    });

    test('runs the executor for known states', async () => {
      const state = { toStrings: () => ['parent', 'parent.child'] } as AnyState;

      await executor.exec(state);

      expect(options['parent']).toHaveBeenCalledWith(state);
      expect(options['parent.child']).toHaveBeenCalledWith(state);
    });
  });
});