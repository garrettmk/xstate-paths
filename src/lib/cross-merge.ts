
/**
 * Shallow-merges two arrays of objects, returning an array of objects with all possible combinations of the two.
 * 
 * @param itemsLeft the array of original items
 * @param itemsRight the array of items to merge over the originals
 * @returns an array of merged items
 */
export function crossMerge<TLeft extends object, TRight extends object = object>(itemsLeft: any[], itemsRight: any[]): (TRight & TLeft)[] {
  const result: any[] = [];

  for (const itemLeft of itemsLeft) {
    for (const itemRight of itemsRight) {
      result.push({ ...itemLeft, ...itemRight });
    }
  }

  const set = new Set(result.map(item => JSON.stringify(item)));
  return Array.from(set).map(item => JSON.parse(item));
}