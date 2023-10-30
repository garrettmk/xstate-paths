import { PathRunner, TransitionCallbackMap } from './path-runner';
import { AnyState } from 'xstate';


export class TestRunner<TContext extends any[]> extends PathRunner<TContext> {
  constructor(
    protected readonly eventCallbacks: TransitionCallbackMap<TContext>, 
    protected readonly stateCallbacks: TransitionCallbackMap<TContext>
  ) { super() }


  protected async onTransition(currentState: AnyState, ...context: TContext) {
    await this.runEventCallbacks(currentState, ...context);
    await this.runStateCallbacks(currentState, ...context);
  }

  protected async runEventCallbacks(state: AnyState, ...context: TContext) {
    const { event } = state;
    const eventCallback = this.eventCallbacks[event.type];

    await eventCallback?.(state, ...context);
  }

  protected async runStateCallbacks(state: AnyState, ...context: TContext) {
    for (const stateValue of state.toStrings()) {
      const stateCallback = this.stateCallbacks[stateValue];
      await stateCallback?.(state, ...context);
    }
  }
}