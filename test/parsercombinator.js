const test = require('ava')

import {
  deep_equal,
} from '../src/util'

import { 
  Success,
  Fail,
  Position,
  string,
  take_while,
  take_some_while,
  or,
  concatenate,
  sequence,
  sequence_flat,
  sequence_longest,
  sequence_some_longest,
  lookahead,
  some,
} from '../src/parsercombinator'

test('deep_equal', t => {
  const l = {
    a: {
      b: 1
    },
    c: 2
  }
  const r1 = {
    a: {
      b: 1
    },
    c: 2
  }
  const r2 = {
    c: 2,
    a: {
      b: 1
    },
  }
  const r3 = {
    a: {
      b: 2
    },
    c: 2
  }
  const r4 = {
    a: {
      b: 2,
      d: 1,
    },
    c: 2
  }

  t.true(deep_equal(l, r1))
  t.true(deep_equal(l, r2))
  t.false(deep_equal(l, r3))
  t.false(deep_equal(l, r4))
  t.true(deep_equal([], []))
})

// succeeds if given empty string
test('string', t => {
  const parser = string('ab\nc')
  
  const actual1 = parser.parse('ab\ncd', Position(0, 1, 1))
  const expected1 = Success('ab\nc', Position(0, 1, 1), Position(4, 2, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('abd', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual2, expected2))

  const actual3 = parser.parse('aab\nc', Position(1, 1, 2))
  const expected3 = Success('ab\nc', Position(1, 1, 2), Position(5, 2, 2))
  t.true(deep_equal(actual3, expected3))
})

test('or', t => {
  const parser = or(string('bc'), string('ab'), string('cd'))

  const actual1 = parser.parse('abc', Position(0, 1, 1))
  const expected1 = Success('ab', Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('cde', Position(0, 1, 1))
  const expected2 = Success('cd', Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual2, expected2))

  const actual3 = parser.parse('zzz', Position(0, 1, 1))
  const expected3 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual3, expected3))

  const parser2 = or()
  const actual4 = parser2.parse('', Position(0, 1, 1))
  const expected4 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual4, expected4))
})

test('sequence', t => {
  const parser = sequence(string('ab'), string('bc'))

  const actual1 = parser.parse('abbcc', Position(0, 1, 1))
  const expected1 = Success(['ab', 'bc'], Position(0, 1, 1), Position(4, 1, 5))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('abbec', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(3, 1, 4))
  t.true(deep_equal(actual2, expected2))

  const parser2 = sequence()

  const actual3 = parser2.parse('', Position(0, 1, 1))
  const expected3 = Success([], Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual3, expected3))
})

test('sequence_flat', t => {
  const parser = sequence_flat(string('a').map(s => [s]), string('b').map(s => [s]))

  const actual1 = parser.parse('abc', Position(0, 1, 1))
  const expected1 = Success(['a', 'b'], Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual1, expected1))
})

test('sequence_longest', t => {
  const parser = sequence_longest(string('a'), string('b'))

  const actual1 = parser.parse('a', Position(0, 1, 1))
  const expected1 = Success(['a'], Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('abc', Position(0, 1, 1))
  const expected2 = Success(['a', 'b'], Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual2, expected2))

  const parser2 = sequence_longest()

  const actual3 = parser2.parse('abc', Position(0, 1, 1))
  const expected3 = Success([], Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual3, expected3))
})

test('sequence_some_longest', t => {
  const parser = sequence_some_longest(string('a'), string('b'))

  const actual1 = parser.parse('a', Position(0, 1, 1))
  const expected1 = Success(['a'], Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('abc', Position(0, 1, 1))
  const expected2 = Success(['a', 'b'], Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual2, expected2))

  const actual4 = parser.parse('c', Position(0, 1, 1))
  const expected4 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual4, expected4))

  const parser2 = sequence_some_longest()

  const actual3 = parser2.parse('abc', Position(0, 1, 1))
  const expected3 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual3, expected3))
})

// parses 0 or more characters 
test('take_while', t => {
  const parser = take_while(c => c === 'a')

  const actual1 = parser.parse('aab', Position(0, 1, 1))
  const expected1 = Success('aa', Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('b', Position(0, 1, 1))
  const expected2 = Success('', Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual2, expected2))
})

test('take_some_while', t => {
  const parser = take_some_while(c => c === 'a')

  const actual1 = parser.parse('aab', Position(0, 1, 1))
  const expected1 = Success('aa', Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('b', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual2, expected2))
})

// if empty return success with empty list
test('concatenate', t => {
  const parser = concatenate(string('ab'), string('cd'))

  const actual1 = parser.parse('abcd', Position(0, 1, 1))
  const expected1 = Success('abcd', Position(0, 1, 1), Position(4, 1, 5))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('ab', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual2, expected2))
})


test('transform', t => {
  const parser = string('abc').transform(({value, start, end}) => ({ a:value, b:start, c:end }))

  const actual1 = parser.parse('abc', Position(0, 1, 1))
  const expected1 = Success({a:'abc', b:Position(0, 1, 1), c:Position(3, 1, 4) }, Position(0, 1, 1), Position(3, 1, 4))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse('b', Position(0, 1, 1))
  const expected2= Fail(Position(0, 1, 1), Position(0, 1, 1)) 
  t.true(deep_equal(actual2, expected2))
})

test('lookahead', t => {
  const parser = lookahead(string('adfs'))

  const actual1 = parser.parse('adfs', Position(0, 1, 1))
  const expected1 = Success('', Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual1, expected1))

  const actual2 = parser.parse(' ', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual1, expected1))
})

test('some', t => {
  const parser = some(string('a'))

  const actual1 = parser.parse('aab  ', Position(0, 1, 1))
  const expected1 = Success(['a', 'a'], Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual1, expected1))
})

test('skip_left', t => {
  const parser = string('ab').skip_left(string('bc'))

  const actual1 = parser.parse('abbc', Position(0, 1, 1))
  const expected1 = Success('bc', Position(2, 1, 3), Position(4, 1, 5))
  t.true(deep_equal(actual1, expected1))
})
