import { describe, test, expect } from 'vitest';
import { EventSource, EventSourceMap } from '@/lib';
import { AnyState } from 'xstate';

const options: Record<string, EventSourceMap | undefined> = {
  none: undefined,
  empty: {},
  withArray: {
    EVENT: [
      { type: 'EVENT', payload: { value: 'foo' } },
      { type: 'EVENT', payload: { value: 'bar' } },
    ]
  },
  withFunction: {
    EVENT: () => [
      { type: 'EVENT', payload: { value: 'foo' } },
      { type: 'EVENT', payload: { value: 'bar' } },
    ]
  },
  withGenerator: {
    EVENT: function* () {
      yield { type: 'EVENT', payload: { value: 'foo' } };
      yield { type: 'EVENT', payload: { value: 'bar' } };
    }
  },
  withEverything: {
    EVENT1: [
      { type: 'EVENT1', payload: { value: 'foo' } },
      { type: 'EVENT1', payload: { value: 'bar' } },
    ],
    EVENT2: () => [
      { type: 'EVENT2', payload: { value: 'foo' } },
      { type: 'EVENT2', payload: { value: 'bar' } },
    ],
    EVENT3: function* () {
      yield { type: 'EVENT3', payload: { value: 'foo' } };
      yield { type: 'EVENT3', payload: { value: 'bar' } };
    }
  }
};

describe('EventSource', () => {
  describe('constructor', () => {
    test('creates an EventSource with no options', () => {
      const source = new EventSource(options.none);
      expect(source).toBeDefined();
    });

    test('creates an EventSource with empty options', () => {
      const source = new EventSource(options.empty);
      expect(source).toBeDefined();
    });

    test('creates an EventSource with options', () => {
      const source = new EventSource(options.withEverything);
      expect(source).toBeDefined();
    });
  });

  describe('generateEvents', () => {
    const eventSource = new EventSource(options.withEverything);

    test('generates arbitrary events', () => {
      const arbitraryType = 'ARBITRARY';
      const expected = [{ type: arbitraryType }];

      const events = [...eventSource.generateEvents(arbitraryType)];

      expect(events).toEqual(expected);
    });

    test('generates known events', () => {
      const expected = options.withEverything!.EVENT1;

      const results = [...eventSource.generateEvents('EVENT1')];

      expect(results).toEqual(expected);
    });
  });

  describe('generateNextEvents', () => {
    const eventSource = new EventSource(options.withEverything);

    test('generates events for each type in state.nextEvents', () => {
      const mockState = { nextEvents: ['ARBITRARY', 'EVENT1'] } as AnyState;
      const expected = [{ type: 'ARBITRARY' }, ...(options.withEverything!.EVENT1 as any[])];

      const events = [...eventSource.generateNextEvents(mockState)];

      expect(events).toEqual(expected);
    });
  });
});