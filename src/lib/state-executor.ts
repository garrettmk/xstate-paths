import { AnyState } from "xstate";
import { Executor } from "@/lib/types";

/**
 * A function that is executed for a state.
 */
export type StateExecFn = (state: AnyState) => void | Promise<void>;

/**
 * An executor for states. On each transition, the executor will execute the
 * callback with the matching state key.
 */
export class StateExecutor implements Executor {
  public readonly execs: Map<string, StateExecFn>;

  /**
   * Creates a new `StateExecutor` from the given options.
   * 
   * @param execs 
   * ```ts
   * const executor1 = new StateExecutor({
   *  'unsubmitted.invalid': (state) => { ... },
   * });
   * ```
   */
  public constructor(execs: Record<string, StateExecFn> = {}) {
    this.execs = new Map(Object.entries(execs));
    this.exec = this.exec.bind(this);
  }

  /**
   * Runs the appropriate callback for the given state.
   * 
   * @param state 
   */
  public async exec(state: AnyState) {
    for (const stateValue of state.toStrings())
      await this.execs.get(stateValue)?.(state);
  }
}