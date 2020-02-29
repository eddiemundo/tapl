const test = require('ava')

const util = require('util')

import * as lexer from '../src/lexer'
import * as parser from '../src/parser'
import {
  substitute,
  create_app,
  create_abs,
  create_var,
  create_debruijn_var,
  get_variable_names,
  terms_equal,
  convert_to_debruijn,
  debruijn_terms_equal,
  evaluate,
  shift_indices
} from '../src/term'

const print_object = o => {
  console.log(util.inspect(o, {showHidden: false, depth: null}))
}

const arrays_shallow_equal = (l, r) => {
  if (l.length === r.length) {
    for (let i = 0; i < l.length; ++i) {
      if (l[i] !== r[i]) return false
    }
    return true
  } else {
    return false
  }
}

test('parse', t => {
  const tokens = lexer.lex('  (  \\  aa  .  bb  cc  (  ee  dd  )  ) ee \\x.x ')

  const expected = create_app(
    [0, 42],
    create_app(
      [0, 39],
      create_abs(
        [0, 6],
        'aa',
        create_app(
          [0, 22],
          create_app(
            [0, 18],
            create_var(
              [0, 16],
              'bb'
            ),
            create_var(
              [0, 20],
              'cc'
            )
          ),
          create_app(
            [0, 29],
            create_var(
              [0, 27],
              'ee'
            ),
            create_var(
              [0, 31],
              'dd'
            )
          )
        )
      ),
      create_var(
        [0, 40],
        'ee'
      )
    ),
    create_abs(
      [0, 43],
      'x',
      create_var(
        [0, 46],
        'x'
      )
    )
  )

  const actual = parser.parse(tokens, 0)

  t.true(terms_equal(actual, expected))

  //'  (  \\  aa  .  bb  cc  (  ee  dd  )  ) ee \\x.x '
  // [aa]
  // [bb, aa]
  // [cc, bb, aa]
  // [ee, cc, bb, aa]
  // [dd, ee, cc, bb, aa]
  // [dd, ee, cc, bb]
  // [dd, ee, cc, bb, x]
  //
  // context of bb, cc, ee, dd
  // [bb, cc, ee, dd, aa]
  // context of x
  // [bb, cc, ee, dd, x]
  //
  // Possibilities for initializing naming context
  // 1. every identifier is put into the naming context during lexing
  //    The naming context is expected to be initialized before parsing.
  //    What if we were doing incremental lexing/parsing using a stream? We can read it all into memory first which defeats
  //    the purpose. The other method is 2 passes like in method 2.
  // 2. parse into a named abstract syntax tree, then scan the tree for free variables, 
  //    then convert it to de Bruijn AST
  //    This is what I actually did, but instead of free variables i scanned all variables. it doesn't matter either way
  //    The naming context needs to handle any possible free variable, and more non-free variables doesn't affect correctness
  // 3. remove the length of the context from each Var node in the AST because we don't really need it except for debugging
  //    Gonna go with this one.
  //    Edit: I tried this and it doesn't work because the fact that I can add free variables after another free variable
  //    means that if the previous free variable is referenced again it will have a different index
  // 4. force all variables to be bound by erroring if a variable is found and the context is empty. from an operational
  //    semantics point of view this almost makes sense, because if variables aren't bound then it's possible to evaluate
  //    to a struck term. but it's not right because it's possible to evaluate a term to a value even if there are free
  //    variables
  // 5. give each variable a mutable value that represents the context, and fill it in with free variables as we go along
  //    so bb gets [bb, aa] which becomes [cc, bb, aa], [ee, cc, bb, aa], [dd, ee, cc, bb, aa] as we reach the other variables.
  //    this is actually a variation of 1. or 2. that is "incremental". Tbh, there is no point in doing this compared to
  //    1. or 2. because we need to read all the tokens to figure out whether or not there are any variables left anyway.

  //t.pass()
})

test('get_variable_names', t => {
  const tokens = lexer.lex('  (  \\  aa  .  bb  cc  (  ee  dd  )  ) ee \\x.x ')
  const term = parser.parse(tokens, 0)
  const actual = get_variable_names(term)
  
  const expected = ['bb', 'cc', 'ee', 'dd', 'x']

  t.true(arrays_shallow_equal(actual, expected))
})

test('convert_to_debruijn', t => {
  const tokens = lexer.lex('  (  \\  aa  .  bb  cc  (  ee  dd  )  ) ee \\x.x ')
  const term = parser.parse(tokens, 0)
  const naming_context = get_variable_names(term)
  
  const actual = convert_to_debruijn(naming_context, term)
  const expected = create_app(
    [0, 42],
    create_app(
      [0, 39],
      create_abs(
        [0, 6],
        'aa',
        create_app(
          [0, 22],
          create_app(
            [0, 18],
            create_debruijn_var(
              [0, 16],
              5
            ),
            create_debruijn_var(
              [0, 20],
              4
            )
          ),
          create_app(
            [0, 29],
            create_debruijn_var(
              [0, 27],
              3
            ),
            create_debruijn_var(
              [0, 31],
              2
            )
          )
        )
      ),
      create_debruijn_var(
        [0, 40],
        2
      )
    ),
    create_abs(
      [0, 43],
      'x',
      create_debruijn_var(
        [0, 46],
        0
      )
    )
  )
  //print_object(actual)
  //print_object(expected)

  t.true(debruijn_terms_equal(actual, expected))
})

test('substitute', t => {
  const tokens = lexer.lex('\\a.b a c')
  const term = parser.parse(tokens, 0)
  const naming_context = get_variable_names(term)
  const debruijn_term = convert_to_debruijn(naming_context, term)

  const actual = substitute([2, create_debruijn_var([0, 0], 9)], debruijn_term)

  const expected = { 
    type: 'abs',
    info: [ 0, 1 ],
    src_var_name: 'a',
    scope: { 
      type: 'app',
      info: [ 0, 7 ],
      lambda: {
        type: 'app',
        info: [ 0, 5 ],
        lambda: {
          type: 'debruijn_var',
          info: [ 0, 0 ],
          index: 10
        },
        argument: { 
          type: 'debruijn_var',
          info: [ 0, 6 ],
          index: 0
        }
      },
      argument: {
        type: 'debruijn_var',
        info: [ 0, 8 ],
        index: 1
      }
    }
  }

  t.true(debruijn_terms_equal(actual, expected))
  t.pass()
})

test('shift', t => {
  const debruijn_term = parser.string_to_debruijn_term('a b c')
  t.true(debruijn_terms_equal(debruijn_term, shift_indices(-1, 0, shift_indices(1, 0, debruijn_term))))
})

test('evaluate', t => {
  const debruijn_term = parser.string_to_debruijn_term('(\\a.b a c) d')
  const actual1 = evaluate(debruijn_term)
  const expected1 = actual1

  // the above is a stuck term since we don't consider free variables to be values
  t.true(debruijn_terms_equal(actual1, expected1))


  const debruijn_term2 = parser.string_to_debruijn_term('(\\a.a b) (\\c.c)')


  const actual2 = evaluate(debruijn_term2)
  const expected2 = {
    type: 'app',
    info: [0, 6],
    lambda: {
      type: 'abs',
      info: [0, 11],
      src_var_name: 'c',
      scope: {
        type: 'debruijn_var',
        info: [0, 14],
        index: 0
      }
    },
    argument: {
      type: 'debruijn_var',
      info: [0, 7],
      index: 1
    }
  }
  //print_object(actual2)
  //print_object(expected2)
  t.true(debruijn_terms_equal(actual2, expected2))
  t.pass()

})

