import { test, expect, describe } from 'vitest';
import { helloWorld } from './main';

describe('main', () => {
  test('hello world', () => {
    expect(helloWorld).toBe('Hello World!');
  });
});