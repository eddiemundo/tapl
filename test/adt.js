const test = require('ava')
import {
  print_object
} from '../src/util'
import {
  SAdt,
  equal,
  match,
} from '../src/adt'

const Maybe = SAdt('Maybe', {
  Some: ['value'],
  None: [],
}, {})

test('SAdt', t => {
  t.true(equal(Maybe.Some(1), Maybe.Some(1)))
  t.pass()
})

test('match', t => {
  t.true(match(Maybe.Some(1), {
    Some: value => value === 1,
    Else: () => false
  }))
  t.true(match(Maybe.None, {
    Some: value => false,
    Else: () => true
  }))
  t.true(match(Maybe.None, {
    Some: (value) => false,
    None: () => true,
  }))
  t.throws(() => {
    match(Maybe.None, {
      Some: (value) => false,
      Dumb: () => false,
    })
  }, { instanceOf: Error, message:'Expected tag to be one of [Some,Dumb], got "None"'})
})

test('equal', t => {
  t.true(equal(1, 1))
  t.false(equal(1, 2))

  t.true(equal([1, 2], [1, 2]))
  t.false(equal([1, 2], [1, 2, 3]))
  t.false(equal([2, 1], [1, 2]))

  t.true(equal({a: 2, b: 1}, {b: 1, a: 2}))
  t.false(equal({a: 2, b: 1}, {b: 1, a: 2, c: 1}))

  t.true(equal(Maybe.Some([1]), Maybe.Some([1])))
  t.false(equal(Maybe.Some([1]), Maybe.Some([2])))
  t.false(equal(Maybe.Some([1]), Maybe.None))
})
