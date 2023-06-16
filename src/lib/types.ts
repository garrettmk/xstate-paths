import { AnyState, AnyEventObject } from "xstate";

export type StateTestFn<TTestContext = any> = (context: TTestContext, state: AnyState) => Promise<void>;

export type EventExecutorFn<TTestContext = any> = (context: TTestContext, event: AnyEventObject) => Promise<void>;

export interface EventMap<TTestContext = any> {
  [key: string]: {
    data?: any[];
    exec: EventExecutorFn<TTestContext>
  }
}

export type DescribeFn = (description: string, callback: () => void) => void;