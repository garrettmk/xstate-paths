import { createMachine } from "xstate";
import { withExecutors } from "../lib/executors/with-executors";
import { EventExecutor } from "../lib/event-executor";
import { EventSource } from "../lib/event-source";
import { Path } from "../lib/path";
import { StateExecutor } from "../lib/executors/state-executor";

const machine = createMachine({
  id: 'simple-machine',
  preserveActionOrder: true,
  predictableActionArguments: true,
  initial: 'one',
  states: {
    one: {
      type: 'parallel',
      states: {
        left: {
          initial: 'a',
          states: {
            a: {
              on: {
                A_TO_B: 'b'
              }
            },
            b: {
              on: {
                B_TO_A: 'a'
              }
            }
          }
        },
        right: {
          initial: 'a',
          states: {
            a: {
              on: {
                A_TO_B: 'b'
              }
            },
            b: {
              on: {
                B_TO_A: 'a'
              }
            }
          }
        }
      },
      on: {
        ONE_TO_TWO: 'two'
      }
    },
    two: {
      on: {
        BACK: 'one',
        TO_THREE: 'three',
        TO_FOUR: 'four',
        TO_FOUR_ALT: 'four'
      }
    },
    three: {
      type: 'final'
    },
    four: {
      on: {
        BACK: 'two',
        TO_ONE: 'one',
        TO_THREE: 'three'
      }
    }
  }
});


const events = new EventSource({
  A_TO_B: function* () {
    yield { type: 'A_TO_B', payload: { foo: 'bar' } };
    yield { type: 'A_TO_B', payload: { foo: 'baz' } };
  },
  TO_FOUR: function* () {
    yield { type: 'TO_FOUR', payload: { foo: 'bar' } };
    yield { type: 'TO_FOUR', payload: { foo: 'baz' } };
  },
});

const execs = new EventExecutor({
  A_TO_B: (event) => console.log(event)
});

const tests = new StateExecutor({
  'one.left.b': () => { console.log('here') }
});


console.time('makePaths');
const paths = await Path.makePaths(machine, {
  eventSource: events,
});
console.timeEnd('makePaths');
console.log(paths.length);

paths[0].run(withExecutors(execs, tests));
