import { AnyState } from "xstate";
import { Path } from "./path";
import { Segment } from "./segment";

export type OnTransitionFn<TContext extends any[]> = (currentState: AnyState, ...context: TContext) => void | Promise<void>;

export type TransitionCallbackMap<TContext extends any[] = []> = {
  [key: string]: OnTransitionFn<TContext>;
};


export abstract class PathRunner<TContext extends any[]> {
  public async run(path: Path, ...context: TContext) {
    let currentState = path.machine.initialState;
    await this.onTransition(currentState, ...context);

    // Use slice() to skip the initial state.
    for (const segment of path.segments.slice(1)) {
      currentState = await this.runSegment(segment, currentState);
      await this.onTransition(currentState, ...context);
    }
  }

  protected async runSegment(segment: Segment, state: AnyState) {
    const nextState = segment.machine.transition(state, segment.event);
    await this.runActions(nextState);

    return nextState;
  }

  protected async runActions(state: AnyState) {
    const { actions, context, event, meta } = state;

    for (const action of actions)
      if (typeof action.exec === 'function')
        await action.exec(context, event, meta);
  }

  protected abstract onTransition(currentState: AnyState, ...context: TContext): Promise<void>;
}
