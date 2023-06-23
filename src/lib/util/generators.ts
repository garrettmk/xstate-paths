
/**
 * Create an array from an async generator.
 * 
 * @param generator
 * @returns
 * 
 * @example
 * ```ts
 * async function* asyncGenerator() {
 *   yield Promise.resolve(1);
 *   yield Promise.resolve(2);
 *   yield Promise.resolve(3);
 * }
 * 
 * const array = await arrayFromAsyncGenerator(asyncGenerator());
 * 
 * console.log(array);
 * // [1, 2, 3]
 * ```
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
 * @param source
 * @returns
 * 
 * @example
 * ```ts
 * const array = [1, 2, 3];
 * 
 * const generator = generatorFromArray(array);
 * 
 * for (const item of generator)
 *  console.log(item);
 * 
 * // 1
 * // 2
 * // 3
 * ```
 */
export function* generatorFromArray<T>(source: T[]): Generator<T> {
  for (const item of source)
    yield item;
}


/**
 * Creates a generator from a generator
 * 
 * @param source
 * @returns
 * 
 * @example
 * ```ts
 * function* generator() {
 *   yield 1;
 *   yield 2;
 *   yield 3;
 * }
 * 
 * const array = arrayFromGenerator(generator());
 * 
 * console.log(array);
 * // [1, 2, 3]
 * ```
 */
export function arrayFromGenerator<T>(source: Generator<T>): T[] {
  return Array.from(source);
}