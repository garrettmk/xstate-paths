import { AnyState } from "xstate";
import { Executor } from "@/lib/types";

export type StateExecFn = (state: AnyState) => void | Promise<void>;

export class StateExecutor implements Executor {
  public readonly execs: Map<string, StateExecFn>;

  public constructor(execs: Record<string, StateExecFn>) {
    this.execs = new Map(Object.entries(execs));
    this.exec = this.exec.bind(this);
  }

  public async exec(state: AnyState) {
    for (const stateValue of state.toStrings())
      await this.execs.get(stateValue)?.(state);
  }
}