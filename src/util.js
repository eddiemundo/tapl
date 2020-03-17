const util = require('util')

export const print_object = o => {
  console.log(util.inspect(o, {showHidden: false, depth: null}))
}

export const contains_symbol = (o, s) => Object.getOwnPropertySymbols(o).includes(s)

export const is_primitive_type = o => {
  const type_name = typeof(o)
  return type_name === 'undefined' || 
         type_name === 'boolean' ||
         type_name === 'number' ||
         type_name === 'bigint' ||
         type_name === 'string' ||
         type_name === 'symbol'
}

export const deep_equal = (l, r) => {
  const l_type = typeof(l)
  const r_type = typeof(r)
  if (typeof(l) !== typeof(r)) {
    return false
  } else {
    if (typeof(l) === 'object') {
      const l_keys = Object.keys(l)
      const r_keys = Object.keys(r)
      if (l_keys.length !== r_keys.length) {
        return false
      } else {
        let is_equal = true
        for (let k of l_keys) {
          is_equal = is_equal && deep_equal(l[k], r[k])
        }
        return is_equal
      }
    } else {
      return l === r
    } 
  }
}

export const flatten_array = as => {
  let result = []
  for (let a of as) {
    result = result.concat(a)
  }
  return result
}

export const Queue = array => {
  const o = {
    start_index: 0,
    array: array,
    length: array.length
  }
  o.dequeue_n = n => {
    const result = o.peek_n(n)
    o.start_index += n
    if (o.start_index > o.array.length) o.start_index = o.array.length
    o.length -= n
    if (o.length < 0) o.length = 0
    return result
  }
  o.dequeue = () => {
    return o.dequeue_n(1)[0]
  }
  o.enqueue = (...as) => {
    o.array = array.concat(as)
    o.length += as.length
    return o
  } 
  o.peek_n = n => {
    return o.array.slice(o.start_index, o.start_index + n)
  }
  o.peek = () => {
    return o.peek_n(1)[0]
  }
  return o
}
