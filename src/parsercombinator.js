import {
  Adt,
} from '../src/adt'

// Position = { index: Index, line: Line, column: Column }
export const Position = Adt('Position', {
  Position: ['index', 'line', 'column']
}).Position

// Result a = Success { value: a, start: Position, end: Position }
//          | Fail { start: Position, end: Position }
export const Result = Adt('Result', { 
  Success: ['value', 'start', 'end'],
  Fail: ['start', 'end'] 
})
export const { Success, Fail } = Result

// Parser a = { parse: (source: Source, start: Position) -> Result a }
const Parser = parse => {
  const o = {
    parse: parse,
  }

  // Parser a ~> (a -> Parser b) -> Parser b
  o.chain = f => Parser((source, start) => {
    const result = o.parse(source, start)
    if (result.tag === 'Fail') {
      return result
    } else {
      return f(result.value).parse(source, result.end)
    }
  })
  // Parser a ~> (a -> b) -> Parser b
  o.map = f => Parser((source, start) => {
    const result = o.parse(source, start)
    if (result.tag === 'Success') {
      return Success(f(result.value), result.start, result.end)
    } else {
      return result
    }
  })

  o.transform = f => Parser((source, start) => {
    const result = o.parse(source, start)
    if (result.tag === 'Success') {
      //console.log(result)
      //console.log(f(result))
      return Success(f(result), result.start, result.end)
    } else {
      return result
    }
  })

  o.skip_left = parser => o.chain(a => parser)

  return o
}

const is_newline = c => c === '\n'

// String -> Parser String
export const string = s => Parser((source, start) => {
  let { index, line, column } = start
  if (source[index] === undefined) {
    return Fail(start, start)
  } else {
    for (var i = 0; i < s.length; ++i) {
      if (source[index + i] === s[i]) {
        if (is_newline(source[index + i])) {
          line += 1
          column = 0
        }
        column += 1
      } else {
        return Fail(start, Position(index + i, line, column))
      }
    }
    return Success(s, start, Position(index + i, line, column))
  }
})

// Monoid a => [Parser a] -> Parser a 
// [Parser String] -> Parser String
export const concatenate = (...parsers) => Parser((source, start) => {
  let value = ''
  let end = start
  for (let parser of parsers) {
    const result = parser.parse(source, end)
    if (result.tag === 'Fail') {
      return Fail(start, end)
    } else {
      end = result.end
      value = value.concat(result.value)
    }
  }
  return Success(value, start, end)
})

// or : [Parser a] -> Parser a
export const or = (...parsers) => Parser((source, start) => {
  for (let parser of parsers) {
    const result = parser.parse(source, start)
    if (result.tag === 'Success') return result
  }
  return Fail(start, start)
})


// sequence : [Parser a] -> Parser [a]
export const sequence = (...parsers) => Parser((source, start) => {
  const values = []
  let end = start
  for (let parser of parsers) {
    const result = parser.parse(source, end)
    end = result.end
    if (result.tag === 'Success') {
      values.push(result.value)
    } else {
      return Fail(start, end)
    }
  }
  return Success(values, start, end)
})

// sequence_flat : [Parser [a]] -> Parser [a]
export const sequence_flat = (...parsers) => Parser((source, start) => {
  const result = sequence(...parsers).parse(source, start)
  if (result.tag === 'Fail') {
    return result
  } else {
    const { value, end } = result
    return Success([].concat(...value), start, end)
  }
})

// take_while : (Char -> Bool) -> Parser String
// Parses 0 or more characters satisfying predicate.
export const take_while = predicate => Parser((source, start) => {
  const { index, line, column } = start
  let last_index = index, last_line = line, last_column = column
  if (source[last_index] === undefined) return Fail(start, start)
  else {
    while (predicate(source[last_index])) {
      last_index += 1
      if (is_newline(source[last_index])) {
        last_line += 1
        last_column = 0
      }
      last_column += 1
    }
    return Success(source.substring(index, last_index), start, Position(last_index, last_line, last_column))
  }
})

// take_some_while : (Char -> Bool) -> Parser String
// Parses 1 or more characters satisfying predicate.
export const take_some_while = predicate => Parser((source, start) => {
  const result = take_while(predicate).parse(source, start)
  if (result.tag === 'Success') {
    if (result.start.index === result.end.index) {
      return Fail(result.start, result.start)
    } else {
      return result
    }
  } else {
    return result
  }
})

// [Parser a] -> Parser [a]
export const sequence_longest = (...parsers) => Parser((source, start) => {
  const values = []
  let end = start
  for (let parser of parsers) {
    const result = parser.parse(source, end)
    if (result.tag === 'Success') {
      // writing this structure is error prone.
      // bug in some, and bug here fixed
      // should refactor
      end = result.end 
      values.push(result.value)
    } else {
      return Success(values, start, end)
    }
  }
  return Success(values, start, end)
})

// [Parser a] -> Parser [a]
export const sequence_some_longest = (...parsers) => Parser((source, start) => {
  const result = sequence_longest(...parsers).parse(source, start)
  if (result.tag === 'Success') {
    if (result.value.length === 0) {
      return Fail(start, start)
    } else {
      return result
    }
  } else {
    return result
  }
})

// Parser a -> Parser String
export const lookahead = parser => Parser((source, start) => {
  const result = parser.parse(source, start)
  if (result.tag === 'Success') {
    return Success('', start, start)
  } else {
    return Fail(start, start)
  }
})

// Parser a -> Parser [a]
export const some = parser => Parser((source, start) => {
  const result = many(parser).parse(source, start)
  if (result.value.length === 0) {
    return Fail(start, result.end)
  } else {
    return result
  }
})

// Parser a -> Parser [a]
export const many = parser => Parser((source, start) => {
  const values = []
  let last_result = parser.parse(source, start)
  if (last_result.tag === 'Fail') {
    return Success(values, start, last_result.end)
  }
  let last_success
  const first_result_start = last_result.start
  while (last_result.tag === 'Success') {
    last_success = last_result
    values.push(last_result.value)
    last_result = parser.parse(source, last_result.end)
  }
  return Success(values, first_result_start, last_success.end)
})

