import { AnyEventObject, AnyState } from "xstate";
import { generatorFromArray } from "./util/generators";

export type EventCreatorFn = () => AnyEventObject[];
export type EventGeneratorFn = () => Generator<AnyEventObject>;

export type EventSource = AnyEventObject[] | EventCreatorFn | EventGeneratorFn;

export interface EventSourceMap {
  [type: string]: EventSource
}

export class EventGenerator {
  protected sources: Map<string, EventGeneratorFn>;

  public constructor(public readonly options: EventSourceMap = {}) {
    this.sources = new Map();

    for (const [type, opts] of Object.entries(options))
      this.sources.set(type, this.getGenerator(opts));
  }

  /**
   * Returns a generator that yields all events that will cause `fromState` to transition.
   * 
   * @param fromState 
   */
  public * generateNextEvents(fromState: AnyState): Generator<AnyEventObject> {
    for (const type of fromState.nextEvents) {
      for (const event of this.generateEvents(type))
        yield event;
    }
  }

  /**
   * Returns a generator that yields events of the given type.
   * 
   * @param type 
   */
  public * generateEvents(type: string): Generator<AnyEventObject> {
    const source = this.sources.get(type);

    if (source)
      for (const event of source())
        yield event;
    else
      yield { type };
  }

  /**
   * Returns an `EventGeneratorFn` for the given source.
   * 
   * @param source 
   * @returns 
   */
  protected getGenerator(source: EventSource): EventGeneratorFn {
    if (Array.isArray(source))
      return () => generatorFromArray(source);

    return () => {
      const arrayOrGenerator = source();
      return Array.isArray(arrayOrGenerator)
        ? generatorFromArray(arrayOrGenerator)
        : arrayOrGenerator;
    }
  }
}