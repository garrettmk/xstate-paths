
# xstate-paths

`xstate-paths` is a path generator and runner for state machines written with [XState](https://xstate.js.org/). It's intended for use in testing, where each path would be used by a test runner.

## What about [`@xstate/test`](https://xstate.js.org/docs/packages/xstate-test/)?

XState has a basic path testing library, but it doesn't allow much customization. I wanted to be able to generate paths that more closely imitate an actual user.

`@xstate/test` also only works with "pure" machines - machines that don't have any internal state. I found that in some situations, this made the testing machines difficult to write and reason about. I needed the testing machine to be able to "remember" previous events.

## Features
- More control over generated paths
- The ability to save and reload generated paths


## To Be Continued

This is the first commit, so I'll fill in more information as the project progresses.