import { AnyState } from "xstate";
import { OnTransitionFn, Executor } from "@/lib/types";


/**
 * Returns an `OnTransitionFn` that calls the given executors in order.
 * 
 * @param executors 
 * @returns an `OnTransitionFn`
 * 
 * @example
 * ```ts
 * const executor1 = {
 *   exec: (state: AnyState) => console.log("executor1", state.value)
 * };
 * 
 * const executor2 = {
 *   exec: (state: AnyState) => console.log("executor2", state.value)
 * };
 * 
 * const onTransition = withExecutors(executor1, executor2);
 * 
 * await onTransition({ value: "foo" });
 * 
 * // executor1 foo
 * // executor2 foo
 * 
 * // or use it directly in a path
 * path.run(withExecutors(executor1, executor2));
 * ```
 */
export function withExecutors(...executors: Executor[]): OnTransitionFn {
  return async function (state: AnyState) {
    for (const executor of executors)
      await executor.exec(state);
  }
}
