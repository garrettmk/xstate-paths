
// Map an object to a property cache
const propertyCache = new WeakMap<any, Map<any, any>>();

/**
 * Caches the result of a property getter, so the getter is only called once.
 * 
 * @example
 * ```ts
 * class MyClass {
 *   @cache
 *   get myProperty() {
 *     return Math.random();
 *   }
 * }
 * 
 * const myInstance = new MyClass();
 * console.log(myInstance.myProperty); // 0.123...
 * console.log(myInstance.myProperty); // 0.123...
 * console.log(myInstance.myProperty); // 0.123...
 * ```
 */
export function cache(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  target; // To silence the unused variable error

  // Replace the property getter with one that does
  // a cache lookup first
  const originalGetter = descriptor.get;

  descriptor.get = function () {
    if (!propertyCache.has(this))
      propertyCache.set(this, new Map());

    const cache = propertyCache.get(this)!;
    if (!cache.get(propertyKey)) {
      const propertyValue = originalGetter?.call(this);
      cache.set(propertyKey, propertyValue);
    }

    return cache.get(propertyKey);
  };

  return descriptor;
}
