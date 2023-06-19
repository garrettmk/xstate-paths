import { AnyEventObject, AnyState } from "xstate";
import { isEmpty, omit } from "radash";

export function describeEvent(event: AnyEventObject): string {
  const eventData = omit(event, ['type']);
  const hasData = !isEmpty(eventData);

  if (hasData)
    return `${event.type} ${JSON.stringify(eventData)}`;
  else
    return event.type;
}

export function describeState(state: AnyState): string {
  const stateStrings = state.toStrings();
  return stateStrings
    .filter(str => !stateStrings.find(s => s.startsWith(str + '.')))
    .join(', ');
}
