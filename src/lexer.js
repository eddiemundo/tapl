const Queue = array => {
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

export const Tokens = array => {
  const q = Queue(array)
  q.consume = type => {
    const token = q.dequeue()
   // console.log(type, token)
    if (token.type !== type) {
      throw new Error(`Expected token type "${type}", got "${token.type}".`)
    }
    return token
  }
  return q
}

const create_separator = (type, info) => ({
  type: type,
  info: info
})

const create_identifier = (value, info) => ({
  type: 'identifier',
  value: value,
  info: info
})

const find_index = (s, i, predicate) => {
  for (; i < s.length; ++i) {
    if (predicate(s[i])) break
  }
  return i
}

const last = as => as[as.length - 1]

const get_next_non_whitespace_index = (s, i) => find_index(s, i, c => !is_whitespace(c))

const get_next_non_alphanumeric_index = (s, i) => find_index(s, i, c => !is_alphanumeric(c))

const is_alphanumeric = c => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.includes(c)

const is_whitespace = c => ' '.includes(c)

const is_separator = c => '\\.()'.includes(c)

const get_identifier_value = (source, i) => {
  const ni = get_next_non_alphanumeric_index(source, i)
  return [source.substring(i, ni), ni]
}

export const lex = source => {
  let line_number = 0
  let column_number = 0
  let tokens = []
  let i = 0
  for (; i < source.length; ++i) {
    const c = source[i]
    if (c === '\n') {
      line_number += 1
      column_number = 0
    } else {
      column_number += 1
      const info = [line_number, column_number]
      if (is_separator(c)) {
        tokens.push(create_separator(c, info))
      } else if (is_alphanumeric(c)) {
        const [identifier_value, ni] = get_identifier_value(source, i)
        tokens.push(create_identifier(identifier_value, info))
        column_number += ni - 1 - i
        i = ni - 1
      } else if (is_whitespace(c)) {
        const ni = get_next_non_whitespace_index(source, i)
        //if (i+1 === 39) console.log(last(tokens))
        //console.log('|'+source.substring(i, ni)+'|',  i + 1, ni + 1 - 1)
        if (ni !== undefined) {
          const last_token = last(tokens)
          if (last_token !== undefined) {
            if (last_token.type === ')' || last_token.type === 'identifier') {
              const nc = source[ni]
              if (nc === '\\' || nc === '(' || is_alphanumeric(nc)) {
                tokens.push(create_separator(' ', info))
              }
            }
          }
          column_number += ni - 1 - i
          i = ni - 1
        }
      }
    }
  }
  return Tokens(tokens)
}

