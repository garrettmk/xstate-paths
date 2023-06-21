import type { AnyState } from 'xstate';

/**
 * A function that is called on a state transition.
 */
export type OnTransitionFn = (state: AnyState) => void | Promise<void>;


/**
 * An executor contains an `exec` method that is called on a state transition.
 */
export interface Executor {
  exec: OnTransitionFn;
}
