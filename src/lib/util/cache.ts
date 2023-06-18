
// Map an object to a cache Map
const propertyCache = new WeakMap<any, Map<any, any>>();

/**
 * Caches the result of a property getter, so the getter is only called once.
 * 
 * @param target 
 * @param propertyKey 
 * @param descriptor 
 * @returns 
 */
export function cache(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  target;

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
