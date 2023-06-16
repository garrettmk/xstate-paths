import { AnyEventObject, AnyState } from "xstate";
import { EventExecutorFn } from "./types";

export interface EventMapOptions<TTestContext = any> {
  [type: string]: {
    data?: any[];
    exec?: EventExecutorFn<TTestContext>;
  }
}

export class EventMap<TTestContext = any> {
  protected data: Map<string, any[]>;
  protected exec: Map<string, EventExecutorFn<TTestContext>>;
  protected static dummyExec = async () => { };

  public constructor(public readonly options: EventMapOptions<TTestContext> = {}) {
    this.data = new Map();
    this.exec = new Map();

    for (const [type, opts] of Object.entries(options)) {
      this.data.set(type, this.getDataFromOpts(opts));
      this.exec.set(type, this.getExecFromOpts(opts));
    }
  }

  public getNextEvents(fromState: AnyState): AnyEventObject[] {
    return fromState.nextEvents.flatMap(type => {
      return this.getEvents(type);
    });
  }

  public getEvents(type: string): AnyEventObject[] {
    const data = this.data.get(type)!;

    if (!data || !data.length)
      return [{ type }];

    return data.map(d => ({ type, ...d }));
  }

  public getExec(type: string): EventExecutorFn<TTestContext> {
    return this.exec.get(type)!;
  }

  public describeEvent(event: AnyEventObject) {
    const { type, ...data } = event;

    return `${type} ${JSON.stringify(data)}`;
  }

  protected getDataFromOpts(options: EventMapOptions[string]) {
    return options?.data ?? [];
  }

  protected getExecFromOpts(options: EventMapOptions[string]) {
    return options?.exec ?? EventMap.dummyExec;
  }
}