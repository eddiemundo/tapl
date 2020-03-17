const test = require('ava')
import {
  print_object
} from '../../src/util'
import {
  equal
} from '../../src/adt'
import {
  DTerm,
  Binding,
  Type,
  Term,
} from '../../src/simplytyped/core'

test('get_type', t => {
  const naming_context = [Binding.Type(undefined, Type.Bool(undefined))]
  const dv = DTerm.Var(undefined, 0)
  const dabs = DTerm.Abs(undefined, 'a', Type.Bool(undefined), dv)
  const dapp = DTerm.App(undefined, dabs, dv)

  const actual1 = dv.get_type(naming_context)
  const expected1 = Type.Bool(undefined)
  t.true(equal(actual1, expected1))
  
  const actual2 = dabs.get_type(naming_context)
  const expected2 = Type.Fn(undefined, Type.Bool(undefined), Type.Bool(undefined))
  t.true(equal(actual2, expected2))

  const actual3 = dapp.get_type(naming_context)
  const expected3 = Type.Bool(undefined)
  t.true(equal(actual3, expected3))
})

test('to_debruijn', t => {
  const v1 = Term.Var(undefined, 'a')
  const v2 = Term.Var(undefined, 'b')
  const abs1 = Term.Abs(undefined, 'c', Type.Bool(undefined), v1)
  const abs2 = Term.Abs(undefined, 'c', Type.Bool(undefined), v2)
  const app = Term.App(undefined, abs1, abs2)
  const naming_context = [Binding.Type('a', Type.Bool(undefined)), Binding.Type('b', Type.Bool(undefined))]

  const actual1 = app.to_debruijn(naming_context)
  const expected1 = DTerm.App(undefined, 
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 2)
    ),
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 1)
    )
  )
  //print_object(actual1)
  t.true(equal(actual1, expected1))
})

test('shift', t => {
  const v1 = Term.Var(undefined, 'a')
  const v2 = Term.Var(undefined, 'b')
  const abs1 = Term.Abs(undefined, 'c', Type.Bool(undefined), v1)
  const abs2 = Term.Abs(undefined, 'c', Type.Bool(undefined), v2)
  const app = Term.App(undefined, abs1, abs2)
  const naming_context = [Binding.Type('a', Type.Bool(undefined)), Binding.Type('b', Type.Bool(undefined))]
  const dapp = app.to_debruijn(naming_context)

  const actual1 = dapp.shift(1, 1)
  const expected1 = DTerm.App(undefined, 
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 3)
    ),
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 1)
    )
  )
  t.true(equal(actual1, expected1))
})

test('substitute', t => {
  const v1 = Term.Var(undefined, 'a')
  const v2 = Term.Var(undefined, 'b')
  const abs1 = Term.Abs(undefined, 'c', Type.Bool(undefined), v1)
  const abs2 = Term.Abs(undefined, 'c', Type.Bool(undefined), v2)
  const naming_context = [Binding.Type('a', Type.Bool(undefined)), Binding.Type('b', Type.Bool(undefined))]
  const dabs1 = abs1.to_debruijn(naming_context)
  const dabs2 = abs2.to_debruijn(naming_context)
  
  const actual1 = dabs1.substitute(1, dabs2)
  const expected1 = DTerm.Abs(undefined, 'c', Type.Bool(undefined),
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 2)
    )
  )
  t.true(equal(actual1, expected1))
})

test('evaluate', t => {
  const dapp = DTerm.App(undefined, 
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 2)
    ),
    DTerm.Abs(undefined, 'c', Type.Bool(undefined),
      DTerm.Var(undefined, 1)
    )
  )

  const actual1 = dapp.evaluate()
  const expected1 = DTerm.Abs(undefined, 'c', Type.Bool(undefined),
    DTerm.Var(undefined, 1)
  )
  t.true(equal(actual1, expected1))
})
