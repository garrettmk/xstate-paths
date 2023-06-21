import { AnyState } from 'xstate';
import { Executor } from '@/lib/types';

export type EventExecFn = (event: string, state: AnyState) => void | Promise<void>;

export class EventExecutor implements Executor {
  public readonly execs: Map<string, EventExecFn>;

  public constructor(execs: Record<string, EventExecFn>) {
    this.execs = new Map(Object.entries(execs));
    this.exec = this.exec.bind(this);
  }

  public async exec(state: AnyState) {
    const event = state.event;
    await this.execs.get(event)?.(event, state);
  }
}