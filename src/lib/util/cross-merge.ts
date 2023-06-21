
/**
 * Shallow-merges two arrays of objects, returning a new array of objects with 
 * all possible combinations of the two.
 * 
 * @param itemsLeft the array of original items
 * @param itemsRight the array of items to merge over the originals
 * @returns an array of merged items
 * 
 * @example
 * ```ts
 * const itemsLeft = [{ a: 1 }, { a: 2 }];
 * const itemsRight = [{ b: 1 }, { b: 2 }];
 * 
 * const merged = crossMerge(itemsLeft, itemsRight);
 * 
 * console.log(merged);
 * // [
 * //   { a: 1, b: 1 },
 * //   { a: 1, b: 2 },
 * //   { a: 2, b: 1 },
 * //   { a: 2, b: 2 }
 * // ]
 * ```
 */
export function crossMerge<TLeft extends object, TRight extends object = object>(itemsLeft: any[], itemsRight: any[]): (TRight & TLeft)[] {
  return Array.from(crossMergeGenerator<TLeft, TRight>(itemsLeft, itemsRight));
}


/**
 * Same as `crossMerge`, but returns a generator instead of an array.
 * 
 * @param itemsLeft 
 * @param itemsRight 
 * @returns a generator of merged items
 * 
 * @example
 * ```ts
 * const itemsLeft = [{ a: 1 }, { a: 2 }];
 * const itemsRight = [{ b: 1 }, { b: 2 }];
 * 
 * const merged = crossMergeGenerator(itemsLeft, itemsRight);
 * 
 * for (const item of merged)
 *  console.log(item);
 * 
 * // { a: 1, b: 1 }
 * // { a: 1, b: 2 }
 * // { a: 2, b: 1 }
 * // { a: 2, b: 2 }
 * ```
 */
export function* crossMergeGenerator<TLeft extends object, TRight extends object = object>(itemsLeft: any[], itemsRight: any[]): Generator<(TRight & TLeft)> {
  for (const itemLeft of itemsLeft) {
    for (const itemRight of itemsRight) {
      yield { ...itemLeft, ...itemRight };
    }
  }
}