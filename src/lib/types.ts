import type { AnyState } from 'xstate';

/**
 * A function that is called on a state transition.
 */
export type OnTransitionFn = (state: AnyState) => void | Promise<void>;