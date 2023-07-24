import { describe, test, expect, vi } from "vitest";
import { EventExecFn, EventExecutor } from "@/lib";
import { AnyState } from "xstate";

const options: Record<string, EventExecFn> = {
  EVENT1: vi.fn(),
};

describe("EventExecutor", () => {
  describe('constructor', () => {
    test('creates an EventExecutor with no options', () => {
      const executor = new EventExecutor();
      expect(executor).toBeDefined();
    });

    test('creates an EventExecutor with empty options', () => {
      const executor = new EventExecutor({});
      expect(executor).toBeDefined();
    });

    test('creates an EventExecutor with options', () => {
      const executor = new EventExecutor(options);
      expect(executor).toBeDefined();
    });
  });

  describe('exec', () => {
    const executor = new EventExecutor(options);

    test('does nothing for unknown events', async () => {
      const event = { type: 'UNKNOWN' };
      const state = { event } as AnyState;

      await executor.exec(state);

      expect(options.EVENT1).not.toHaveBeenCalled();
    });

    test('runs the executor for known events', async () => {
      const event = { type: 'EVENT1' };
      const state = { event } as AnyState;

      await executor.exec(state);

      expect(options.EVENT1).toHaveBeenCalledWith(event, state);
    });
  });  
});