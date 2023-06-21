import { AnyState } from "xstate";

export interface Executor {
  exec(state: AnyState): void | Promise<void>;
}


export function withExecutors(...executors: Executor[]) {
  return async function (state: AnyState) {
    for (const executor of executors)
      await executor.exec(state);
  }
}
