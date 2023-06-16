import { get, isEmpty, isFunction, omit } from "radash";
import { AnyEventObject, AnyState, AnyStateMachine } from "xstate";
import { EventMap } from "./event-map.js";


/**
 * A segment of a test path. Applies a single event to a state and tests
 * the resulting state.
 */
export class TestSegment<TTestContext = any> {
  protected _description: string;

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
    public readonly events: EventMap<TTestContext> = new EventMap(),
  ) {
    this._description = `${this.eventDescription} -> ${this.stateDescription}`;
  }

  /**
   * A description of the segment
   */
  public get description() {
    return this._description;
    // return `${this.eventDescription} -> ${this.stateDescription}`;
  }

  /**
   * A description of the segment's `event`.
   */
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
  public matches(other: TestSegment) {
    return this.description === other.description;
  }

  /**
   * Compares the event types and final states of the segments. Returns
   * true if they are equal.
   * 
   * @param other The segment to compare to.
   * @returns boolean
   */
  public isSimilar(other: TestSegment) {
    return this.hasSimilarEvent(other) && this.hasSameTarget(other);
  }

  /**
   * Compares the final states of the segments. Returns true if they are
   * equal.
   * 
   * @param other 
   * @returns 
   */
  public hasSameTarget(other: TestSegment) {
    return JSON.stringify(this.target) === JSON.stringify(other.target);
  }

  public hasSimilarEvent(other: TestSegment) {
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
   * The segment's `tests`.
   */
  public get tests() {
    return Object.values(this.state.meta)
      .map(meta => get(meta, 'test'))
      .filter(isFunction);
  }

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
  public async run(context: TTestContext, state: AnyState) {
    await this.executeEvent(context);
    const nextState = await this.applyEvent(state);

    this.assertMatchesTarget(nextState);
    await this.runTests(context, nextState);

    return nextState;
  }

  /**
   * Applies the given events to the segment's `state` and returns an
   * array of `TestSegments` for each resulting state.
   * 
   * @returns an array of `TestSegments`
   */
  public async makeNextSegments() {
    const fromState = this.state;
    const nextEvents = this.events.getNextEvents(fromState);

    return nextEvents.map(event => {
      const nextState = this.machine.transition(fromState, event);
      return new TestSegment(this.machine, nextState, this.events);
    });
  }

  /**
   * Call's the event's `exec` function with the segments `event`
   * and the given context.
   * 
   * @param context The context to pass to the `exec` function.
   */
  protected async executeEvent(context: TTestContext) {
    if (this.event.type === 'xstate.init')
      return;

    const exec = this.events.getExec(this.event.type);
    await exec(context, this.event);
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

  /**
   * Runs the segments tests against the given context and state.
   * 
   * @param context 
   * @param state 
   */
  protected async runTests(context: TTestContext, state: AnyState) {
    for (const test of this.tests)
      await test(context, state);
  }

  /**
   * Returns a list of events that can be applied to the given state.
   * 
   * @param fromState 
   * @param events 
   * @returns 
   */
  protected getNextEvents(fromState: AnyState, events: EventMap<TTestContext>): AnyEventObject[] {
    return fromState.nextEvents.flatMap(type => events.getEvents(type));
  }
}
