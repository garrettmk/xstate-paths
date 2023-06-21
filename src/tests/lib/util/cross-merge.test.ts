import { describe, test, expect } from 'vitest';
import { crossMerge, crossMergeGenerator } from '@/lib/util/cross-merge';

describe('util', () => {

  const left = [{ a: 1 }, { a: 2 }];
  const right = [{ b: 1 }, { b: 2 }];
  const expected = [
    { a: 1, b: 1 },
    { a: 1, b: 2 },
    { a: 2, b: 1 },
    { a: 2, b: 2 }
  ];

  describe('crossMerge', () => {
    test('returns the expected result', () => {
      const result = crossMerge(left, right);
      expect(result).toMatchObject(expected);
    });
  });

  describe('crossMergeGenerator', () => {
    test('returns the expected result', () => {
      const result = Array.from(crossMergeGenerator(left, right));
      expect(result).toMatchObject(expected);
    });
  });
})