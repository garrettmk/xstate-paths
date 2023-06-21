import { describe, test, expect } from 'vitest';
import { cache } from '@/lib/util/cache';

describe('util', () => {
  describe('cache', () => {
    class TestClass {
      @cache
      get someProperty() {
        return Math.random();
      }
    }

    test('caches property values', () => {
      const instance = new TestClass();

      const firstValue = instance.someProperty;
      const secondValue = instance.someProperty;

      expect(firstValue).toEqual(secondValue);
    });
  });
})