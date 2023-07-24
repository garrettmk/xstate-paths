import { describe, test, expect } from 'vitest';
import { Path, Segment } from '@/lib'
import { createMachine } from 'xstate';

const testMachine = createMachine({
  id: 'test-machine',
  preserveActionOrder: true,
  predictableActionArguments: true,
  initial: 'start',
  states: {
    start: {
      on: {
        NEXT: 'middle'
      }
    },
    middle: {
      initial: 'a',
      states: {
        a: {
          on: {
            B: 'b'
          }
        },
        b: {
          on: {
            A: 'a',
          }
        }
      },
      on: {
        NEXT: 'end'
      }
    },
    end: {
      type: 'final'
    }
  }
});


describe('Path', () => {
  describe('constructor', () => {
    test('creates a Path for the machine\'s initial state', () => {
      const path = new Path(testMachine);

      expect(path.segments.length).toEqual(1);
      expect(path.segments[0].event.type).toEqual('xstate.init');
    });

    test('creates a Path from the given machine and segments', () => {
      const middleState = testMachine.transition(testMachine.initialState, 'NEXT');
      const segments = [
        new Segment(testMachine, testMachine.initialState),
        new Segment(testMachine, middleState),
      ];
      const path = new Path(testMachine, segments);

      expect(path.segments.length).toEqual(2);
      expect(path.segments[0].event.type).toEqual('xstate.init');
      expect(path.segments[1].event.type).toEqual('NEXT');
    });
  });

  
});