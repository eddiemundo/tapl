const test = require('ava')
import {
  deep_equal,
  print_object
} from '../../src/util'
import {
  equal
} from '../../src/adt'
import {
  Position,
  Success,
} from '../../src/parsercombinator'
import {
  lex
} from '../../src/simplytyped/lexer'
import {
  parse_type,
  parse_term,
} from '../../src/simplytyped/parser'
import {
  Term,
  Type,
} from '../../src/simplytyped/core'


test('parse_type', t => {
  const tokens1 = lex('(Bool -> Bool) -> Bool')
  const actual1 = parse_type(tokens1, 0)
  const expected1 = Type.Fn(
    [Position(15, 1, 16), Position(17, 1, 18)],
    Type.Fn(
      [Position(6, 1, 7), Position(8, 1, 9)],
      Type.Bool([Position(1, 1, 2), Position(5, 1, 6)]),
      Type.Bool([Position(9, 1, 10), Position(13, 1, 14)]),
    ),
    Type.Bool([Position(18, 1, 19), Position(22, 1, 23)])
  )
  t.true(deep_equal(actual1, expected1))

  const tokens2 = lex('Bool -> Bool -> Bool')
  const actual2 = parse_type(tokens2, 0)
  const expected2 = Type.Fn(
    [Position(5, 1, 6), Position(7, 1, 8)],
    Type.Bool([Position(0, 1, 1), Position(4, 1, 5)]),
    Type.Fn(
      [Position(13, 1, 14), Position(15, 1, 16)],
      Type.Bool([Position(8, 1, 9), Position(12, 1, 13)]),
      Type.Bool([Position(16, 1, 17), Position(20, 1, 21)]),
    ),
  )
  t.true(deep_equal(actual2, expected2))

  const tokens3 = lex('Bool')
  const actual3 = parse_type(tokens3, 0)
  const expected3 = Type.Bool([Position(0, 1, 1), Position(4, 1, 5)])
  t.true(deep_equal(actual3, expected3))
})

test('parse_term', t => {
  const tokens1 = lex(' ( \\ a : (Bool -> Bool) -> Bool . a b ) c ')
  const actual1 = parse_term(tokens1, 0)
  const expected1 = Term.App(
    [Position(39, 1, 40), Position(40, 1, 41)],
    Term.Abs(
      [Position(3, 1, 4), Position(4, 1, 5)],
      'a',
      Type.Fn(
        [Position(24, 1, 25), Position(26, 1, 27)],
        Type.Fn(
          [Position(15, 1, 16), Position(17, 1, 18)],
          Type.Bool([Position(10, 1, 11), Position(14, 1, 15)]),
          Type.Bool([Position(18, 1, 19), Position(22, 1, 23)]),
        ),
        Type.Bool([Position(27, 1, 28), Position(31, 1, 32)])
      ),
      Term.App(
        [Position(35, 1, 36), Position(36, 1, 37)],
        Term.Var(
          [Position(34, 1, 35), Position(35, 1, 36)],
          'a'
        ),
        Term.Var(
          [Position(36, 1, 37), Position(37, 1, 38)],
          'b'
        )
      )
    ),
    Term.Var(
      [Position(40, 1, 41), Position(41, 1, 42)],
      'c'
    )
  )
  t.true(equal(actual1, expected1))
})

