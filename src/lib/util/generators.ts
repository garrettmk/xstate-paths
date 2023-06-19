
/**
 * Create an array from an async generator.
 * 
 * @param generator 
 * @returns 
 */
export async function arrayFromAsyncGenerator<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const item of generator)
    result.push(item);

  return result;
}


/**
 * Create a generator from an array.
 */
export function* generatorFromArray<T>(source: T[]): Generator<T> {
  for (const item of source)
    yield item;
}


export function arrayFromGenerator<T>(source: Generator<T>): T[] {
  return Array.from(source);
}