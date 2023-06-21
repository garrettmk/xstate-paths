import { describe, test, expect } from 'vitest';
import { arrayFromAsyncGenerator, arrayFromGenerator, generatorFromArray } from '@/lib/util/generators';


describe('util', () => {
  describe('arrayFromAsyncGenerator', () => {
    test('creates an array from an async generator', async () => {
      async function* asyncGenerator() {
        yield 1;
        yield 2;
        yield 3;
      }

      const result = await arrayFromAsyncGenerator(asyncGenerator());

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('generatorFromArray', () => {
    test('creates a generator from an array', () => {
      const result = generatorFromArray([1, 2, 3]);

      const values = arrayFromGenerator(result);

      expect(values).toEqual([1, 2, 3]);
    });
  });

  describe('arrayFromGenerator', () => {
    test('creates an array from a generator', () => {
      function* generator() {
        yield 1;
        yield 2;
        yield 3;
      }

      const result = arrayFromGenerator(generator());

      expect(result).toEqual([1, 2, 3]);
    });
  });
});