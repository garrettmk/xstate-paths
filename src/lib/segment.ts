import { isEmpty, omit } from "radash";
import { AnyState, AnyStateMachine } from "xstate";
import { EventSource } from "@/lib/event-source";
import { cache } from "@/lib/util";


/**
 * A segment of a test path. Applies a single event to a state and tests
 * the resulting state.
 */
export class Segment {
  /**
   * 
   * @param machine The machine used to `transition` between states.
   * @param state The target state.
   * @param exec An event exec function that is called before the event 
   *             is applied to the state.
   */
  public constructor(
    public readonly machine: AnyStateMachine,
    public readonly state: AnyState = machine.initialState,
    public readonly events: EventSource = new EventSource(),
  ) { }

  /**
   * Runs the segment on the given state and returns the resulting state.
   * 
   * First, the `exec` function is called with the given context and event.
   * Then `machine` is used to apply the `event` to the `state`. The
   * resulting state is then tested against the `target` state. Finally,
   * the `tests` are run against the resulting state.
   * 
   * @param context The context to pass to the exec and test functions.
   * @param state The starting state.
   * @returns the resulting state.
   */
  public async run(state: AnyState) {
    const nextState = await this.applyEvent(state);
    this.assertMatchesTarget(nextState);

    return nextState;
  }

  /**
   * Generates events for the segment's `state` and yields a `TestSegment`
   * for each resulting state.
   * 
   */
  public async * generateNextSegments() {
    const fromState = this.state;

    if (!fromState.done)
      for (const event of this.events.generateNextEvents(fromState)) {
        const nextState = this.machine.transition(fromState, event);
        yield new Segment(this.machine, nextState, this.events);
      }
  }


  /**
   * A description of the segment
   */
  @cache
  public get description() {
    return `${this.eventDescription} -> ${this.stateDescription}`;
  }

  /**
   * A description of the segment's `event`.
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
   */
  public get target() {
    return this.state.value;
  }

  /**
   * The segment's `event`.
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
   */
  public hasSameTarget(other: Segment) {
    return JSON.stringify(this.target) === JSON.stringify(other.target);
  }

  public hasSimilarEvent(other: Segment) {
    return this.event.type === other.event.type;
  }

  /**
   * Compares the final states of the segments. Returns true if they are
   * not equal.
   *  
   * @param other
   * @returns
   */
  public reachesState(state: AnyState) {
    return JSON.stringify(this.target) === JSON.stringify(state.value);
  }

  public isFinal() {
    return this.state.done || this.state.nextEvents.length === 0;
  }






  /**
   * Applies the segment's `event` to the given state and returns the
   * resulting state.
   * 
   * @param state 
   * @returns 
   */
  protected async applyEvent(state: AnyState): Promise<AnyState> {
    const nextState = this.machine.transition(state, this.event);
    await this.runActions(nextState);

    return nextState;
  }

  /**
   * Throws an error unless the given `state` matches the segment's
   * target state.
   * 
   * @param state 
   */
  protected assertMatchesTarget(state: AnyState) {
    if (!this.state.matches(state.value))
      throw new Error(`Expected state to be ${this.state.value}, but was ${state.value}`);
  }

  /**
   * Runs the state's `actions`.
   * 
   * @param state 
   */
  protected async runActions(state: AnyState) {
    const { actions, context, event, meta } = state;

    for (const action of actions) {
      if (typeof action.exec === 'function')
        await action.exec(context, event, meta);
    }
  }
}
