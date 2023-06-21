
/**
 * Create an array from an async generator.
 * 
 * @param generator A generator for `Promise<T>`s
 * @returns A Promise for an array of `T`s
 */
export async function arrayFromAsyncGenerator<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const item of generator)
    result.push(item);

  return result;
}


/**
 * Create a generator from an array.
 * 
 * @param source An array of `T`s
 * @returns A generator for `T`s
 */
export function* generatorFromArray<T>(source: T[]): Generator<T> {
  for (const item of source)
    yield item;
}


/**
 * Creates a generator from a generator
 * 
 * @param source A generator for `T`s
 * @returns An array of `T`s
 */
export function arrayFromGenerator<T>(source: Generator<T>): T[] {
  return Array.from(source);
}