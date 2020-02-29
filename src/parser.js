import * as lexer from '../src/lexer'
import {create_abs, create_var, create_app, get_variable_names, convert_to_debruijn} from '../src/term'

const precedence_table = {
  ' ': 1,
}

const prefix_parser_table = {
  '(': (token, tokens) => {
    //console.log('Left Paren')
    const inner = parse(tokens, 0)
    tokens.consume(')')
    return inner
  },
  '\\': (token, tokens) => {
    //console.log('Lambda')
    const info = token.info
    const src_var_name = tokens.consume('identifier').value
    tokens.consume('.')
    const scope = parse(tokens, 0)
    return create_abs(info, src_var_name, scope)
  },
  'identifier': (token, tokens) => {
    //console.log('Identifier')
    return create_var(token.info, token.value)
  }
}

const infix_parser_table = {
  ' ': (left_term, token, tokens) => {
    //console.log('Application')
    const argument = parse(tokens, precedence_table[' '])
    return create_app(token.info, left_term, argument) 
  }
}

// parse : Queue Token -> Term
export const parse = (tokens, precedence) => {
  //console.log('Parse')
  const token = tokens.dequeue()
  const parse_prefix = prefix_parser_table[token.type]

  let left_term = parse_prefix(token, tokens)

  while(tokens.length > 0 && precedence < precedence_table[tokens.peek().type]) {
    const next_token = tokens.dequeue()
    const parse_infix = infix_parser_table[next_token.type]
    left_term = parse_infix(left_term, next_token, tokens)
  }

  return left_term
}

export const string_to_debruijn_term = s => {
  const tokens = lexer.lex(s)
  const term = parse(tokens, 0)
  const naming_context = get_variable_names(term)
  const debruijn_term = convert_to_debruijn(naming_context, term)
  return debruijn_term
}


//const info_to_string = info => `${info[0]}:${info[1]}`

