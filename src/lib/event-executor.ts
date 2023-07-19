import { AnyState, EventObject } from 'xstate';
import { Executor } from '@/lib/types';

/**
 * A function that executes an event.
 */
export type EventExecFn = (event: string, state: AnyState) => void | Promise<void>;

/**
 * An executor for events. On each transition, the executor will execute the
 * event that caused the transition.
 */
export class EventExecutor implements Executor {
  public readonly execs: Map<string, EventExecFn>;

  /**
   * Creates a new `EventExecutor` from the given options.
   * 
   * @param execs 
   * 
   * @example
   * ```ts
   * const executor1 = new EventExecutor();
   * const executor2 = new EventExecutor({
   *  INPUT: (event, state) => { ... },
   * });
   * ```
   */
  public constructor(execs: Record<string, EventExecFn> = {}) {
    this.execs = new Map(Object.entries(execs));
    this.exec = this.exec.bind(this);
  }

  /**
   * Runs the appropriate event executor for the given state.
   * 
   * @param state 
   */
  public async exec(state: AnyState) {
    const event = state.event as EventObject;
    await this.execs.get(event.type)?.(event.type, state);
  }
}