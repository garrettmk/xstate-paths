import { group } from "radash";
import { AnyState, AnyStateMachine } from "xstate";
import { EventMap } from "./event-map.js";
import { TestSegment } from "./test-segment.js";

export type DescribeFn = (description: string, callback: () => void) => void;

export type RunCallbackFn<C = any> = (path: TestPath<C>) => void;

export type MakePathOptions<C = any> = {
  filterSegment?: (segment: TestSegment<C>, path: TestPath<C>) => boolean;
  filterPath?: (path: TestPath<C>) => boolean;
  maxLength?: number;
}

export class TestPath<C = any> {
  public constructor(
    public readonly machine: AnyStateMachine,
    protected readonly events: EventMap<C> = new EventMap(),
    public readonly segments: TestSegment<C>[] = []
  ) {
    if (!segments.length) {
      const initialSegment = new TestSegment(machine, machine.initialState, events);
      this.segments.push(initialSegment);
    }
  }

  public static recursivelyDescribe<C = any>(
    paths: TestPath<C>[],
    describe: DescribeFn,
    each: RunCallbackFn<C>,
  ) {
    const groupedByTarget = group(paths, path => path.targetDescription);

    for (const [target, paths = []] of Object.entries(groupedByTarget)) {
      describe(`reaches ${target}`, () => {
        paths.forEach(path => {
          const events = path.segments.map(segment => segment.eventDescription);

          const run = ([head, ...tail]: string[]) => {
            if (!tail.length)
              describe(head, () => {
                each(path);
              });
            else if (head === 'xstate.init')
              run(tail);
            else
              describe(head, () => run(tail));
          };

          run(events);
        });
      });
    }
  }

  public static async makePaths<C = any, TEventMap extends EventMap = EventMap>(machine: AnyStateMachine, events: TEventMap, options?: MakePathOptions<C>) {
    const pathToInitialState = new TestPath<C>(machine, events);
    const nextPaths = await pathToInitialState.makeNextPaths(options)

    return TestPath.deduplicate([pathToInitialState, ...nextPaths]);
  }

  public static deduplicate(paths: TestPath[]) {
    const deduplicatedPaths: TestPath[] = [];

    // Take the longest paths first, and then remove any paths that are subpaths of those
    const sortedPaths = paths.sort((a, b) => b.length - a.length); // Longest first

    // Using a Map for performance reasons
    const descriptions = new Map<TestPath, string>(paths.map(path => [path, path.description]));

    // Only keep paths that aren't travelled by other paths
    for (const path of sortedPaths) {
      if (!deduplicatedPaths.some(p => descriptions.get(p)!.includes(descriptions.get(path)!)))
        deduplicatedPaths.push(path);
    }

    return deduplicatedPaths.reverse();
  }

  public get description() {
    return this.segments
      .map(({ description }) => description)
      .join(' -> ');
  }

  public get target() {
    return this.lastSegment?.target;
  }

  public get targetDescription() {
    return JSON.stringify(this.target);
  }

  public get firstSegment(): TestSegment<C> | undefined {
    return this.segments[0];
  }

  public get lastSegment(): TestSegment<C> | undefined {
    return this.segments[this.segments.length - 1];
  }

  public get length() {
    return this.segments.length;
  }

  public async run(context: C) {
    let currentState = this.machine.initialState;

    for (const segment of this.segments) {
      currentState = await segment.run(context, currentState);
    }
  }

  public async makeNextPaths(options?: MakePathOptions<C>): Promise<TestPath<C>[]> {
    // Get options with defaults
    const {
      filterSegment = TestPath.defaultSegmentFilter,
      filterPath = TestPath.defaultPathFilter,
      maxLength = 10,
    } = options ?? {};

    // Get the next possible segments
    const nextSegments = await this.lastSegment?.makeNextSegments() ?? [];
    const nextPaths: TestPath<C>[] = [];

    // Make a path for each next segment that passes the filter
    for (const nextSegment of nextSegments) {
      if (!filterSegment(nextSegment, this))
        continue;

      const nextPath = new TestPath(
        this.machine,
        this.events,
        this.segments.concat(nextSegment)
      );

      // If the path passes the filter, add it to the list of next paths
      if (filterPath(nextPath))
        nextPaths.push(nextPath);

      // If we haven't reached the max length, make next paths for the next path
      if (!nextPath.isFinal() && nextPath.length < maxLength)
        nextPaths.push(...await nextPath.makeNextPaths(options));
    }

    return nextPaths;
  }

  public static defaultSegmentFilter(segment: TestSegment, path: TestPath) {
    return !path.alreadyHasSegment(segment);
  }

  public static defaultPathFilter(path: TestPath) {
    path;
    return true;
  }

  public alreadyHasSegment(segment: TestSegment<C>) {
    return this.segments.some(s => s.matches(segment));
  }

  public countMatches(segment: TestSegment<C>) {
    return this.segments.filter(s => s.matches(segment)).length;
  }

  public alreadyHasSimilarSegment(segment: TestSegment) {
    return this.segments.some(s => s.isSimilar(segment));
  }

  public countSimilar(segment: TestSegment) {
    return this.segments.filter(s => s.isSimilar(segment)).length;
  }

  public alreadyReachesState(state: AnyState) {
    return this.segments.some(s => s.reachesState(state));
  }

  public matches(other: TestPath<C>) {
    return this.description === other.description;
  }

  public includes(other: TestPath<C>) {
    return this.description.includes(other.description);
  }

  public isFinal() {
    return this.lastSegment?.isFinal() ?? false;
  }
}