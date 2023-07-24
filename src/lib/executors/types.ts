import { OnTransitionFn } from "../types";

/**
 * An executor contains an `exec` method that is called on a state transition.
 */
export interface Executor {
  exec: OnTransitionFn;
}
