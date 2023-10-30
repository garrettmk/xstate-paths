import { describe, test, expect, vi } from "vitest";
import { EventSource, Segment, arrayFromAsyncGenerator } from "@/lib";
import { createMachine } from "xstate";


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



describe("Segment", () => {
  describe('constructor', () => {
    test('creates a Segment for the machine\'s initial state', () => {
      const segment = new Segment(testMachine);

      expect(JSON.stringify(segment.state)).toEqual(JSON.stringify(testMachine.initialState));
    });

    test('creates a Segment for the given machine and state', () => {
      const state = testMachine.transition(testMachine.initialState, 'NEXT');
      const segment = new Segment(testMachine, state);

      expect(JSON.stringify(segment.state)).toEqual(JSON.stringify(state));
    });
  });

  describe('generateNextSegments', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');    
    const middleSegment = new Segment(testMachine, middleState);
      
      test('generates all possible next segments using a default EventSource', async () => {
        const nextSegments = await arrayFromAsyncGenerator(middleSegment.generateNextSegments());
  
        expect(nextSegments.length).toEqual(2);
        expect(nextSegments[0].event.type).toEqual('B');
        expect(nextSegments[1].event.type).toEqual('NEXT');
      });
  
      test('generates all possible next segments with a given event source', async () => {
        const eventSource = new EventSource();
        const originalGenerateNextEvents = eventSource.generateNextEvents;
        eventSource.generateNextEvents = vi.fn().mockImplementation(originalGenerateNextEvents);

        const nextSegments = await arrayFromAsyncGenerator(middleSegment.generateNextSegments(eventSource));
  
        expect(eventSource.generateNextEvents).toHaveBeenCalled();
        expect(nextSegments.length).toEqual(2);
        expect(nextSegments[0].event.type).toEqual('B');
        expect(nextSegments[1].event.type).toEqual('NEXT');
      });
  });


  describe('description', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');    
    const middleSegment = new Segment(testMachine, middleState);
    
    test('includes the state description', () => {
      expect(middleSegment.description).toContain(middleSegment.stateDescription);
    });

    test('includes the event description', () => {
      expect(middleSegment.description).toContain(middleSegment.eventDescription);
    });
  });

  describe('eventDescription', () => {
    const eventData = { foo: 'bar' };
    const middleState = testMachine.transition(testMachine.initialState, { type: 'NEXT', ...eventData });    
    const middleSegment = new Segment(testMachine, middleState);

    test('includes the event type', () => {
      expect(middleSegment.eventDescription).toContain(middleSegment.event.type);
    });

    test('includes the event data', () => {
      expect(middleSegment.eventDescription).toContain(JSON.stringify(eventData));
    });
  });

  describe('stateDescription', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');    
    const middleSegment = new Segment(testMachine, middleState);

    test('includes the state value', () => {
      expect(middleSegment.stateDescription).toEqual('middle.a')
    });
  });

  describe('target', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');    
    const middleSegment = new Segment(testMachine, middleState);

    test('returns the target state', () => {
      expect(middleSegment.target).toEqual(middleState.value);
    });
  });

  describe('event', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');    
    const middleSegment = new Segment(testMachine, middleState);

    test('returns the event', () => {
      expect(middleSegment.event).toEqual(middleState.event);
    });
  });

  describe('matches', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');    
    const middleSegment = new Segment(testMachine, middleState);
    const middleSegment2 = new Segment(testMachine, middleState);

    test('should match itself', () => {
      expect(middleSegment.matches(middleSegment)).toEqual(true);
    });

    test('should match an identical segment', () => {
      expect(middleSegment.matches(middleSegment2)).toEqual(true);
    });
  });

  describe('isSimilar', () => {
    const event1 = { type: 'NEXT', foo: 'bar' };
    const middleState1 = testMachine.transition(testMachine.initialState, event1);
    const middleSegment1 = new Segment(testMachine, middleState1);

    const event2 = { type: 'NEXT', bar: 'baz' };
    const middleState2 = testMachine.transition(testMachine.initialState, event2);
    const middleSegment2 = new Segment(testMachine, middleState2);

    test('should be similar to itself', () => {
      expect(middleSegment1.isSimilar(middleSegment1)).toEqual(true);
    });

    test('should be similar to a segment with the same event type and state', () => {
      expect(middleSegment1.isSimilar(middleSegment2)).toEqual(true);
    });
  });

  describe('hasSameTarget', () => {
    const event1 = { type: 'NEXT', foo: 'bar' };
    const middleState1 = testMachine.transition(testMachine.initialState, event1);
    const middleSegment1 = new Segment(testMachine, middleState1);

    const event2 = { type: 'NEXT', bar: 'baz' };
    const middleState2 = testMachine.transition(testMachine.initialState, event2);
    const middleSegment2 = new Segment(testMachine, middleState2);

    test('should have the same target as itself', () => {
      expect(middleSegment1.hasSameTarget(middleSegment1)).toEqual(true);
    });

    test('should return true for a segment with the same state', () => {
      expect(middleSegment1.hasSameTarget(middleSegment2)).toEqual(true);
    });
  });

  describe('hasSimilarEvent', () => {
    const event1 = { type: 'NEXT', foo: 'bar' };
    const middleState1 = testMachine.transition(testMachine.initialState, event1);
    const middleSegment1 = new Segment(testMachine, middleState1);

    const event2 = { type: 'NEXT', bar: 'baz' };
    const middleState2 = testMachine.transition(testMachine.initialState, event2);
    const middleSegment2 = new Segment(testMachine, middleState2);

    test('should have a similar event to itself', () => {
      expect(middleSegment1.hasSimilarEvent(middleSegment1)).toEqual(true);
    });

    test('should return true for a segment with the same event type', () => {
      expect(middleSegment1.hasSimilarEvent(middleSegment2)).toEqual(true);
    });
  });

  describe('reachesState', () => {
    const event1 = { type: 'NEXT', foo: 'bar' };
    const middleState = testMachine.transition(testMachine.initialState, event1);
    const middleSegment = new Segment(testMachine, middleState);

    const endState = testMachine.transition(middleState, 'NEXT');

    test('should return true if the segment reaches the given state', () => {
      expect(middleSegment.reachesState(middleState)).toEqual(true);
    });

    test('should return false if the segment doees not reach the given state', () => {
      expect(middleSegment.reachesState(endState)).toEqual(false);
    });
  });

  describe('isFinal', () => {
    const middleState = testMachine.transition(testMachine.initialState, 'NEXT');
    const middleSegment = new Segment(testMachine, middleState);

    const endState = testMachine.transition(middleState, 'NEXT');
    const endSegment = new Segment(testMachine, endState);

    test('should return false if the segment does not reach a final state', () => {
      expect(middleSegment.isFinal()).toEqual(false);
    });

    test('should return true if the segment reaches a final state', () => {
      expect(endSegment.isFinal()).toEqual(true);
    });
  });
});