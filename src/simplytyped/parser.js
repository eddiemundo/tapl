import {
} from '../../src/adt'
import {
  Term,
  Type,
} from '../../src/simplytyped/core'

const parse = (prefix_parser_table, infix_parser_table, precedence_table) => (tokens, precedence) => {
  const token = tokens.dequeue()
  const parse_prefix = prefix_parser_table[token.tag]

  let left = parse_prefix(token, tokens)

  while(tokens.length > 0 && precedence < precedence_table[tokens.peek().tag]) {
    const next_token = tokens.dequeue()
    const parse_infix = infix_parser_table[next_token.tag]
    left = parse_infix(left, next_token, tokens)
  }

  return left
}


const { Bool, Fn } = Type

const type_precedence_table = {
  'RArrow': 1
}

const prefix_type_parser_table = {
  'LParen': (token, tokens) => {
    const type = parse_type(tokens, 0)
    tokens.consume('RParen')
    return type
  },
  'Identifier': (token, tokens) => {
    const info = [token.start, token.end]
    if (token.value === 'Bool') {
      return Bool(info)
    } else {
      throw new Error(`Expected Bool, got ${token.value}`)
    }
  },
}

const infix_type_parser_table = {
  'RArrow': (input, token, tokens) => {
    const info = [token.start, token.end]
    // right associative
    const output = parse_type(tokens, 0)
    return Fn(info, input, output)
  }
}

export const parse_type = parse(prefix_type_parser_table, infix_type_parser_table, type_precedence_table)

const term_precedence_table = {
  'Whitespace': 1,
}

const prefix_term_parser_table = {
  'LParen': (token, tokens) => {
    //console.log('LParen')
    const inner = parse_term(tokens, 0)
    tokens.consume('RParen')
    return inner
  },
  'Backslash': (token, tokens) => {
    //console.log('Abs')
    const info = [token.start, token.end]
    const var_name = tokens.consume('Identifier').value
    tokens.consume('Colon')
    const var_type = parse_type(tokens, 0)
    tokens.consume('Period')
    const scope = parse_term(tokens, 0)
    return Term.Abs(info, var_name, var_type, scope)
  },
  'Identifier': (token, tokens) => {
    //console.log('Identifier')
    const info = [token.start, token.end]
    return Term.Var(info, token.value)
  },
}

const infix_term_parser_table = {
  'Whitespace': (abs, token, tokens) => {
    //console.log('App')
    // left associative
    const arg = parse_term(tokens, term_precedence_table['Whitespace'])
    const info = [token.start, token.end]
    return Term.App(info, abs, arg) 
  },
}

export const parse_term = parse(prefix_term_parser_table, infix_term_parser_table, term_precedence_table)

export const string_to_debruijn_term = s => {
  const tokens = lexer.lex(s)
  const term = parse_term(tokens, 0)
  const naming_context = get_variable_names(term)
  const debruijn_term = convert_to_debruijn(naming_context, term)
  return debruijn_term
}

