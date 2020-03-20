import { 
//  deep_equal,
  flatten_array,
  Queue,
} from '../../src/util'
import {
} from '../../src/adt'
import {
  take_some_while,
  string,
  concatenate,
  or,
//  sequence,
//  sequence_flat,
  sequence_some_longest,
  lookahead,
  some,
  many,
  Position,
} from '../../src/parsercombinator'


export const Tokens = array => {
  const q = Queue(array)
  q.consume = type => {
    const token = q.dequeue()
   // console.log(type, token)
    if (token.tag !== type) {
      throw new Error(`Expected token type "${type}", got "${token.tag}".`)
    }
    return token
  }
  return q
}

export const Token = (tag, value, start, end) => ({
  type: 'Token',
  tag: tag,
  value: value,
  start: start,
  end: end,
})

const tokenize = tag => ({value, start, end}) => {
  const t = Token(tag, value, start, end) 
  return t
}

export const is_alphanumeric = c => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.includes(c)

export const is_whitespace = c => ' '.includes(c)

const identifier = take_some_while(c => is_alphanumeric(c))
const backslash = string('\\')
const period = string('.')
const lparen = string('(')
const rparen = string(')')
const rarrow = string('->')
const colon = string(':')
export const whitespace = take_some_while(c => is_whitespace(c))

export const identifier_token = identifier.transform(tokenize('Identifier'))
export const backslash_token = backslash.transform(tokenize('Backslash'))
export const period_token = period.transform(tokenize('Period'))
export const lparen_token = lparen.transform(tokenize('LParen'))
export const rparen_token = rparen.transform(tokenize('RParen'))
export const colon_token = colon.transform(tokenize('Colon'))
export const rarrow_token = rarrow.transform(tokenize('RArrow'))
export const identifier_or_rparen_maybe_whitespace_tokens = sequence_some_longest(
  or(rparen_token, identifier_token),
  concatenate(whitespace, lookahead(or(lparen, identifier, backslash))).transform(tokenize('Whitespace')) // Parser Token, String
)

export const token = or(
  or(
    backslash_token,
    colon_token,
    rarrow_token,
    period_token,
    lparen_token,
  ).map(token => [token]),
  identifier_or_rparen_maybe_whitespace_tokens
)

export const tokens = some(many(whitespace).skip_left(token)).map(flatten_array)

// crashes if can't lex the source
export const lex = source => {
  const result = tokens.parse(source, Position(0, 1, 1))
  return Tokens(result.value)
}


