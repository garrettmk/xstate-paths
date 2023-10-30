import { isEmpty, omit } from "radash";
import { AnyState, AnyStateMachine } from "xstate";
import { EventSource } from "@/lib/event-source";
import { cache } from "@/lib/util";


/**
 * A single segment of a path, representing an event and the resulting state. For example, if a 
 * `SUBMIT` event causes a transition to the state `submitted`, the segment would be `SUBMIT -> submitted`:
 * 
 * ```ts
 * const segment = new Segment(machine, submittedState);
 * console.log(segment.description);  // "SUBMIT -> submitted"
 * ```
 * 
 * `Segment` allows you to replay the event onto another state later:
 * 
 * ```ts
 * const nextState = await segment.run(unsubmittedState);
 * 
 * console.log(unsubmittedState.value);   // "unsubmitted"
 * console.log(nextState.event.type);     // "SUBMIT"
 * console.log(nextState.value);          // "submitted"
 * ```
 */
export class Segment {
  /**
   * Create a new `Segment`.
   * 
   * @param machine The machine used to `transition` between states.
   * @param state The target state. Defaults to the machine's `initialState`.
   * 
   * @example
   * 
   * ```ts
   * const segment = new Segment(machine);
   * console.log(segment.description);      // "xstate.init -> <initial state>"
   * ```
   */
  public constructor(
    public readonly machine: AnyStateMachine,
    public readonly state: AnyState = machine.initialState,
  ) { }

  /**
   * Generates all possible segments that can follow this segment.
   * 
   * @param eventSource 
   * 
   * @example
   * ```ts
   * const initialSegment = new Segment(machine);
   * const nextSegmentGenerator = await initialSegment.generateNextSegments();
   * 
   * // nextSegmentGenerator will yield a segment for each possible
   * // event that can be applied to the initial state.
   * ```
   * 
   */
  public async * generateNextSegments(eventSource: EventSource = new EventSource()) {
    const fromState = this.state;

    if (!fromState.done)
      for (const event of eventSource.generateNextEvents(fromState)) {
        const nextState = this.machine.transition(fromState, event);
        yield new Segment(this.machine, nextState);
      }
  }


  /**
   * A description of the segment. Includes both the event and the resulting state.
   * 
   * @example
   * ```ts
   * segment.description;   // "SUBMIT { data: ... } -> submitted"
   * ```
   */
  @cache
  public get description() {
    return `${this.eventDescription} -> ${this.stateDescription}`;
  }

  /**
   * A description of the segment's `event`. Includes the event type and any data.
   * 
   * @example
   * ```ts
   * segment.eventDescription;   // "SUBMIT { data: ... }"
   * ```
   */
  @cache
  public get eventDescription() {
    const eventData = omit(this.event, ['type']);
    const hasData = !isEmpty(eventData);

    if (hasData)
      return `${this.event.type} ${JSON.stringify(eventData)}`;
    else
      return this.event.type;
  }

  /**
   * A description of the segment's `state`.
   * 
   * @example
   * ```ts
   * segment.stateDescription;   // "submitted"
   * ```
   */
  @cache
  public get stateDescription() {
    const stateStrings = this.state.toStrings();
    return stateStrings
      .filter(str => !stateStrings.find(s => s.startsWith(str + '.')))
      .join(', ');
  }

  /**
   * The target state's `StateValue`
   * 
   * @example
   * ```ts
   * segment.target;                        // "submitted"
   * segment.target.matches('submitted');  // true
   * ```
   */
  public get target() {
    return this.state.value;
  }

  /**
   * The segment's `event`.
   * 
   * @example
   * ```ts
   * segment.event;   // { type: "SUBMIT", data: ... }
   * ```
   */
  public get event() {
    return this.state.event;
  }

  /**
   * Compares both the events and final states of the segments. Returns
   * true if they are equal.
   * 
   * @param other The segment to compare to.
   * @returns boolean
   * 
   * @example
   * ```ts
   * firstSegment.description;   // "SUBMIT { data: "data one" } -> submitted"
   * secondSegment.description;  // "SUBMIT { data: "data two" } -> submitted"
   * 
   * firstSegment.matches(secondSegment);   // false, because the have different data
   * ```
   */
  public matches(other: Segment) {
    return this.description === other.description;
  }

  /**
   * Compares the event types and final states of the segments. Returns
   * true if they are equal.
   * 
   * @param other The segment to compare to.
   * @returns boolean
   * 
   * @example
   * ```ts
   * firstSegment.description;   // "SUBMIT { data: "data one" } -> submitted"
   * secondSegment.description;  // "SUBMIT { data: "data two" } -> submitted"
   * 
   * firstSegment.isSimilar(secondSegment);   // true, because the have the same event type and final state
   * ```
   */
  public isSimilar(other: Segment) {
    return this.hasSimilarEvent(other) && this.hasSameTarget(other);
  }

  /**
   * Compares the final states of the segments. Returns true if they are
   * equal.
   * 
   * @param other 
   * @returns 
   * 
   * @example
   * ```ts
   * firstSegment.description;   // "SUBMIT { data: "data one" } -> submitted"
   * secondSegment.description;  // "SUBMIT { data: "data two" } -> submitted"
   * 
   * firstSegment.hasSameTarget(secondSegment);   // true
   * ```
   */
  public hasSameTarget(other: Segment) {
    return JSON.stringify(this.target) === JSON.stringify(other.target);
  }

  /**
   * Compares the event types of the segments. Returns true if they are equal.
   * 
   * @param other 
   * @returns 
   * 
   * @example
   * ```ts
   * firstSegment.description;   // "SUBMIT { data: "data one" } -> submitted"
   * secondSegment.description;  // "SUBMIT { data: "data two" } -> submitted"
   * 
   * firstSegment.hasSimilarEvent(secondSegment);   // true
   * ```
   * 
   * 
   */
  public hasSimilarEvent(other: Segment) {
    return this.event.type === other.event.type;
  }

  /**
   * Compares the final states of the segments. Returns true if they are equal.
   *  
   * @param other
   * @returns
   * 
   * @example
   * ```ts
   * firstSegment.description;   // "SUBMIT { data: "data one" } -> submitted"
   * 
   * firstSegment.reachesState(submittedState);   // true
   */
  public reachesState(state: AnyState) {
    return JSON.stringify(this.target) === JSON.stringify(state.value);
  }

  /**
   * Returns true if the segment's `state` is a final state. A final state
   * is a state that can take no events.
   * 
   * @returns 
   * 
   * @example
   * ```ts
   * segment.description;   // "SUBMIT { data: "data one" } -> submitted"
   * segment.isFinal();     // true
   * ```
   */
  public isFinal() {
    return this.state.done || this.state.nextEvents.length === 0;
  }
}
