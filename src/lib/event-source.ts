import { AnyEventObject, AnyState } from "xstate";
import { generatorFromArray } from "@/lib/util";

/**
 * A function that returns event objects.
 */
export type EventCreatorFn = () => AnyEventObject[];

/**
 * A function that returns a generator that yields event objects.
 */
export type EventGeneratorFn = () => Generator<AnyEventObject>;

/**
 * An source of event objects.
 */
export type EventSourceArg = AnyEventObject[] | EventCreatorFn | EventGeneratorFn;

export interface EventSourceMap {
  [type: string]: EventSourceArg
}

/**
 * `EventSource` provides generators that yield event objects. It is used by
 * `Segment` to generate possible events that will cause a state to transition.
 */
export class EventSource {
  protected sources: Map<string, EventGeneratorFn>;

  /**
   * Create an `EventSource` from the given options.
   * 
   * @param options 
   * 
   * @example
   * ```ts
   * const source = new EventSource({
   *  INPUT: [
   *    { type: "INPUT", payload: { value: "foo" } },
   *    { type: "INPUT", payload: { value: "bar" } },
   *  ],
   * 
   *  SUBMIT: [{ type: "SUBMIT" }],
   *  
   *  CANCEL: [{ type: "CANCEL" }],
   * 
   *  OTHER: function* () {
   *    yield { type: "OTHER", payload: { value: "baz" } };
   *    yield { type: "OTHER", payload: { value: "qux" } };
   *  }
   * });
   */
  public constructor(public readonly options: EventSourceMap = {}) {
    this.sources = new Map();

    for (const [type, opts] of Object.entries(options))
      this.sources.set(type, this.getGenerator(opts));
  }

  /**
   * Yields all events that can be sent to `fromState`.
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
   * Yields events of the given type.
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
   * @internal
   * 
   * Returns an `EventGeneratorFn` for the given source.
   * 
   * @param source 
   * @returns 
   */
  protected getGenerator(source: EventSourceArg): EventGeneratorFn {
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