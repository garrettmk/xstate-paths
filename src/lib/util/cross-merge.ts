
/**
 * Shallow-merges two arrays of objects, returning an array of objects with all possible combinations of the two.
 * 
 * @param itemsLeft the array of original items
 * @param itemsRight the array of items to merge over the originals
 * @returns an array of merged items
 */
export function crossMerge<TLeft extends object, TRight extends object = object>(itemsLeft: any[], itemsRight: any[]): (TRight & TLeft)[] {
  return Array.from(crossMergeGenerator<TLeft, TRight>(itemsLeft, itemsRight));
}


/**
 * Same as `crossMerge`, but returns a generator instead of an array.
 * 
 * @param itemsLeft 
 * @param itemsRight 
 */
export function* crossMergeGenerator<TLeft extends object, TRight extends object = object>(itemsLeft: any[], itemsRight: any[]): Generator<(TRight & TLeft)> {
  for (const itemLeft of itemsLeft) {
    for (const itemRight of itemsRight) {
      yield { ...itemLeft, ...itemRight };
    }
  }
}