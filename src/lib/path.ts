import { AnyState, AnyStateMachine } from "xstate";
import { EventSource } from "@/lib/event-source";
import { Segment } from "@/lib/segment";
import { arrayFromAsyncGenerator } from "@/lib/util";
import { OnTransitionFn } from "@/lib/types";


/**
 * Options for `Path.makePaths`.
 */
export type MakePathOptions = {
  filterSegment?: (segment: Segment, path: Path) => boolean;
  filterPath?: (path: Path) => boolean;
  maxLength?: number;
}



/**
 * A path through a state machine.
 */
export class Path {
  /**
   * Create a new Path.
   * 
   * @param machine 
   * @param events 
   * @param segments 
   */
  public constructor(
    public readonly machine: AnyStateMachine,
    protected readonly events: EventSource = new EventSource(),
    public readonly segments: Segment[] = []
  ) {
    if (!segments.length) {
      const initialSegment = new Segment(machine, machine.initialState, events);
      this.segments.push(initialSegment);
    }
  }

  /**
   * Create paths for the given machine.
   * 
   * @param machine 
   * @param events 
   * @param options 
   * @returns 
   */
  public static async makePaths(machine: AnyStateMachine, events: EventSource = new EventSource(), options: MakePathOptions = {}) {
    const pathGenerator = Path.generatePaths(machine, events, options);
    const paths = await arrayFromAsyncGenerator(pathGenerator);

    return paths;
  }

  /**
   * Generate paths for the given machine.
   * 
   * @param machine 
   * @param events 
   * @param options 
   */
  public static async * generatePaths(machine: AnyStateMachine, events: EventSource, options?: MakePathOptions) {
    const {
      filterPath = Path.defaultPathFilter,
    } = options ?? {};

    const pathToInitialState = new Path(machine, events);

    if (filterPath(pathToInitialState))
      yield pathToInitialState;

    yield* pathToInitialState.generateNextPaths(options);
  }

  /**
   * Deduplicate the given paths. A path is considered "duplicated" if another path
   * contains all of its segments.
   * 
   * @param paths 
   * @returns 
   */
  public static deduplicate(paths: Path[]) {
    const deduplicatedPaths: Path[] = [];

    // Take the longest paths first, and then remove any paths that are subpaths of those
    const sortedPaths = paths.sort((a, b) => b.length - a.length); // Longest first

    // Using a Map for performance reasons
    const descriptions = new Map<Path, string>(paths.map(path => [path, path.description]));

    // Only keep paths that aren't travelled by other paths
    for (const path of sortedPaths) {
      if (!deduplicatedPaths.some(p => descriptions.get(p)!.includes(descriptions.get(path)!)))
        deduplicatedPaths.push(path);
    }

    return deduplicatedPaths.reverse();
  }

  /**
   * Runs each path in the iterable with onTransition.
   * 
   * @param paths 
   * @param onTransition 
   */
  public static async runPaths(paths: Path[] | Generator<Path>, onTransition?: OnTransitionFn) {
    for (const path of paths)
      path.run(onTransition);
  }

  /**
   * Generate the next possible paths.
   * 
   * @param options 
   */
  public async * generateNextPaths(options?: MakePathOptions): AsyncGenerator<Path> {
    // Get options with defaults
    const {
      filterSegment = Path.defaultSegmentFilter,
      filterPath = Path.defaultPathFilter,
      maxLength = 10,
    } = options ?? {};

    // Get the next possible segments
    const nextSegments = await this.lastSegment?.generateNextSegments() ?? [];

    // Make a path for each next segment that passes the filter
    for await (const nextSegment of nextSegments) {
      if (!filterSegment(nextSegment, this))
        continue;

      const nextPath = new Path(
        this.machine,
        this.events,
        this.segments.concat(nextSegment)
      );

      // If the path passes the filter, yield it
      if (filterPath(nextPath))
        yield nextPath;

      // If we haven't reached the max length, make next paths for the next path
      if (!nextPath.isFinal() && nextPath.length < maxLength)
        yield* nextPath.generateNextPaths(options);
    }
  }

  /**
   * The default segment filter. This filter excludes segments that are already
   * in the path.
   * 
   * @param segment 
   * @param path 
   * @returns 
   */
  public static defaultSegmentFilter(segment: Segment, path: Path) {
    return path.countSimilarSegments(segment) < 2;
  }

  /**
   * The default path filter. This includes only 'final' paths.
   * 
   * @param path 
   * @returns 
   */
  public static defaultPathFilter(path: Path) {
    return path.isFinal();
  }


  /**
   * Run the path. At each step, the `onTransition` callback is called with the
   * current state (this includes the initial state).
   * 
   * @param options 
   */
  public async run(onTransition?: OnTransitionFn): Promise<void> {
    let currentState = this.machine.initialState;
    await onTransition?.(currentState);

    for (const segment of this.segments.slice(1)) {
      currentState = await segment.run(currentState);
      await onTransition?.(currentState);
    }
  }


  // Properties

  /**
   * The description of the path. This is the description of each segment,
   * concatenated with ` -> `. It completely describes the path, and can be
   * used to compare it with another path.
   */
  public get description() {
    return this.segments
      .map(({ description }) => description)
      .join(' -> ');
  }

  /**
   * The final state of the path.
   */
  public get target() {
    return this.lastSegment?.target;
  }

  /**
   * The description of the final state of the path.
   */
  public get targetDescription() {
    return JSON.stringify(this.target);
  }

  /**
   * The first segment of the path, if there is one.
   */
  public get firstSegment(): Segment | undefined {
    return this.segments[0];
  }

  /**
   * The last segment of the path, if there is one.
   */
  public get lastSegment(): Segment | undefined {
    return this.segments[this.segments.length - 1];
  }

  /**
   * The number of segments in the path.
   */
  public get length() {
    return this.segments.length;
  }


  // Checks and comparisons

  /**
   * Returns true if the path already contains the given segment.
   * 
   * @param segment 
   * @returns 
   */
  public alreadyHasSegment(segment: Segment) {
    return this.segments.some(s => s.matches(segment));
  }

  /**
   * Returns true if the path already contains a 'similar' segment. A segment
   * is considered 'similar' if it has the same event and target (but not necessarily
   * the same payload).
   * 
   * @param segment 
   * @returns 
   */
  public alreadyHasSimilarSegment(segment: Segment) {
    return this.segments.some(s => s.isSimilar(segment));
  }

  /**
   * Returns true if the path reaches the given state.
   * 
   * @param state 
   * @returns 
   */
  public alreadyReachesState(state: AnyState) {
    return this.segments.some(s => s.reachesState(state));
  }

  /**
   * Returns true if the path matches the given path. Two paths match if they
   * have identical segments.
   * 
   * @param other 
   * @returns 
   */
  public matches(other: Path) {
    return this.description === other.description;
  }

  /**
   * Returns true if the path includes the given path. A path includes another
   * path if it contains all of its segments.
   * 
   * @param other 
   * @returns 
   */
  public includes(other: Path) {
    return this.description.includes(other.description);
  }

  /**
   * Returns true if the path ends in a final segment.
   * 
   * @returns 
   */
  public isFinal() {
    return this.lastSegment?.isFinal() ?? false;
  }


  /**
   * Returns the number of matching segments in the path.
   * 
   * @param segment 
   * @returns 
   */
  public countMatchingSegments(segment: Segment) {
    return this.segments.filter(s => s.matches(segment)).length;
  }

  /**
   * Returns the number of similar segments in the path.
   * 
   * @param segment 
   * @returns 
   */
  public countSimilarSegments(segment: Segment) {
    return this.segments.filter(s => s.isSimilar(segment)).length;
  }
}