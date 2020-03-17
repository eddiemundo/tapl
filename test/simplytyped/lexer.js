const test = require('ava')
import { deep_equal, print_object } from '../../src/util'
import { Success, Fail, Position, or, many } from '../../src/parsercombinator'
import { 
  Token,
  identifier_token,
  backslash_token,
  period_token,
  colon_token,
  lparen_token,
  rparen_token,
  rarrow_token,
  whitespace,
  identifier_or_rparen_maybe_whitespace_tokens,
  token,
  tokens,

} from '../../src/simplytyped/lexer'

test('identifier_token', t => {
  const actual1 = identifier_token.parse('abc1', Position(0, 1, 1))
  const expected1 = Success(Token('Identifier', 'abc1', Position(0, 1, 1), Position(4, 1, 5)), Position(0, 1, 1), Position(4, 1, 5)) 
  t.true(deep_equal(actual1, expected1))

  const actual2 = identifier_token.parse('.', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual2, expected2))
})

test('backslash_token', t => {
  const actual1 = backslash_token.parse('\\', Position(0, 1, 1))
  const expected1 = Success(Token('Backslash', '\\', Position(0, 1, 1), Position(1, 1, 2)), Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = backslash_token.parse('a', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual1, expected1))
})

test('period_token', t => {
  const actual1 = period_token.parse('.', Position(0, 1, 1))
  const expected1 = Success(Token('Period', '.', Position(0, 1, 1), Position(1, 1, 2)), Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = period_token.parse('a', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual1, expected1))
})

test('lparen_token', t => {
  const actual1 = lparen_token.parse('(', Position(0, 1, 1))
  const expected1 = Success(Token('LParen', '(', Position(0, 1, 1), Position(1, 1, 2)), Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = lparen_token.parse('a', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual1, expected1))
})

test('rparen_token', t => {
  const actual1 = rparen_token.parse(')', Position(0, 1, 1))
  const expected1 = Success(Token('RParen', ')', Position(0, 1, 1), Position(1, 1, 2)), Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))
  
  const actual2 = rparen_token.parse('a', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(0, 1, 1))
  t.true(deep_equal(actual1, expected1))
})

test('rarrow_token', t => {
  const actual1 = rarrow_token.parse('->', Position(0, 1, 1))
  const expected1 = Success(Token('RArrow', '->', Position(0, 1, 1), Position(2, 1, 3)), Position(0, 1, 1), Position(2, 1, 3))
  t.true(deep_equal(actual1, expected1))
  
  const actual2 = rarrow_token.parse('-', Position(0, 1, 1))
  const expected2 = Fail(Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))
})

test('identifier_or_rparen_maybe_whitespace_tokens', t => {
  const actual1 = identifier_or_rparen_maybe_whitespace_tokens.parse('a ', Position(0, 1, 1))
  const expected1 = Success([Token('Identifier', 'a', Position(0, 1, 1), Position(1, 1, 2))], Position(0, 1, 1), Position(1, 1, 2))
  t.true(deep_equal(actual1, expected1))

  const actual2 = identifier_or_rparen_maybe_whitespace_tokens.parse('a  b', Position(0, 1, 1))
  const expected2 = Success([
    Token('Identifier', 'a', Position(0, 1, 1), Position(1, 1, 2)),
    Token('Whitespace', '  ', Position(1, 1, 2), Position(3, 1, 4))
  ], Position(0, 1, 1), Position(3, 1, 4))
  t.true(deep_equal(actual2, expected2))

  const actual3 = identifier_or_rparen_maybe_whitespace_tokens.parse(')  b  ', Position(0, 1, 1))
  const expected3 = Success([
    Token('RParen', ')', Position(0, 1, 1), Position(1, 1, 2)),
    Token('Whitespace', '  ', Position(1, 1, 2), Position(3, 1, 4))
  ], Position(0, 1, 1), Position(3, 1, 4))
  t.true(deep_equal(actual3, expected3))

  const actual4 = identifier_or_rparen_maybe_whitespace_tokens.parse('a  (', Position(0, 1, 1))
  const expected4 = Success([
    Token('Identifier', 'a', Position(0, 1, 1), Position(1, 1, 2)),
    Token('Whitespace', '  ', Position(1, 1, 2), Position(3, 1, 4))
  ], Position(0, 1, 1), Position(3, 1, 4))
  t.true(deep_equal(actual4, expected4))

  const actual5 = identifier_or_rparen_maybe_whitespace_tokens.parse('a  \\', Position(0, 1, 1))
  const expected5 = Success([
    Token('Identifier', 'a', Position(0, 1, 1), Position(1, 1, 2)),
    Token('Whitespace', '  ', Position(1, 1, 2), Position(3, 1, 4))
  ], Position(0, 1, 1), Position(3, 1, 4))
  t.true(deep_equal(actual5, expected5))

})

test('token', t => {
  const parser = tokens
  
  const actual1 = parser.parse('  \\  a  :  Boolean -> String  .  b  \\  c  :  List  ->   Number  .  d  (  e  f  )  g  ', Position(0, 1, 1))
  const expected1 = Success([
    Token('Backslash', '\\', Position(2, 1, 3), Position(3, 1, 4)),
    Token('Identifier', 'a', Position(5, 1, 6), Position(6, 1, 7)),
    Token('Colon', ':', Position(8, 1, 9), Position(9, 1, 10)),
    Token('Identifier', 'Boolean', Position(11, 1, 12), Position(18, 1, 19)),
    Token('RArrow', '->', Position(19, 1, 20), Position(21, 1, 22)),
    Token('Identifier', 'String', Position(22, 1, 23), Position(28, 1, 29)),
    Token('Period', '.', Position(30, 1, 31), Position(31, 1, 32)),
    Token('Identifier', 'b', Position(33, 1, 34), Position(34, 1, 35)),
    Token('Whitespace', '  ', Position(34, 1, 35), Position(36, 1, 37)),
    Token('Backslash', '\\', Position(36, 1, 37), Position(37, 1, 38)),
    Token('Identifier', 'c', Position(39, 1, 40), Position(40, 1, 41)),
    Token('Colon', ':', Position(42, 1, 43), Position(43, 1, 44)),
    Token('Identifier', 'List', Position(45, 1, 46), Position(49, 1, 50)),
    Token('RArrow', '->', Position(51, 1, 52), Position(53, 1, 54)),
    Token('Identifier', 'Number', Position(56, 1, 57), Position(62, 1, 63)),
    Token('Period', '.', Position(64, 1, 65), Position(65, 1, 66)),
    Token('Identifier', 'd', Position(67, 1, 68), Position(68, 1, 69)),
    Token('Whitespace', '  ', Position(68, 1, 69), Position(70, 1, 71)),
    Token('LParen', '(', Position(70, 1, 71), Position(71, 1, 72)),
    Token('Identifier', 'e', Position(73, 1, 74), Position(74, 1, 75)),
    Token('Whitespace', '  ', Position(74, 1, 75), Position(76, 1, 77)),
    Token('Identifier', 'f', Position(76, 1, 77), Position(77, 1, 78)),
    Token('RParen', ')', Position(79, 1, 80), Position(80, 1, 81)),
    Token('Whitespace', '  ', Position(80, 1, 81), Position(82, 1, 83)),
    Token('Identifier', 'g', Position(82, 1, 83), Position(83, 1, 84)),
  ], Position(2, 1, 3), Position(83, 1, 84))

  //print_object(actual1)
  //print_object(expected1)
  t.true(deep_equal(actual1, expected1))
  t.pass()
})
