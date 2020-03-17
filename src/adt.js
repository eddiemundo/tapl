import {
  is_primitive_type,
  contains_symbol,
} from '../src/util'

export const properties = Symbol('properties')

export const Adt = (type_name, definition) => {
  const constructors = {}
  for (let [tag, field_names] of Object.entries(definition)) {
    constructors[tag] = (...args) => {
      const adt = {
        type: type_name,
        tag: tag
      }
      for (let i = 0; i < field_names.length; ++i) {
         adt[field_names[i]] = args[i]
      }
      return adt
    }
  }
  return constructors
}

export const symbols = ({
  properties: Symbol('properties')
})

export const properties_symbol = Symbol('properties')

// const value = {
//   [symbol.properties]: {
//     type: {
//       [symbol.properties]: {
//         name: 'Term',
//         definition: {
//           Var: [...],
//           Abs: [...],
//           App: [...]
//         }
//       },
//       match: (value, cases) => {}
//     },
//     tag: Var,
//   }
// }
export const get_properties = value => value[properties_symbol]
export const get_type = value => get_properties(value).type
export const get_tag = value => get_properties(value).tag
export const get_type_name = value => get_properties(get_type(value)).name

export const is_builtin_type = o => {
  return is_primitive_type(o) || !contains_symbol(o, properties_symbol)
}
// if both same builtin types
//   if primitive type, use ===
//   else,
//     if both not have properties, recurse on keys of both function objects and objects
//     else both have properties, use type equal
//     else, error
// else, error
export const equal = (l, r) => {
  const l_builtin_type_name = typeof(l)
  const r_builtin_type_name = typeof(r)
  if (l_builtin_type_name !== r_builtin_type_name) {
    throw new Error(`Expected "${l_builtin_type_name}", got "${r_builtin_type_name}"`)
  } else {
    if (l_builtin_type_name === 'undefined' ||
        l_builtin_type_name === 'boolean' ||
        l_builtin_type_name === 'number' ||
        l_builtin_type_name === 'bigint' ||
        l_builtin_type_name === 'string' ||
        l_builtin_type_name === 'symbol') {
      return l === r
    } else {
      const l_properties = l[properties_symbol]
      const r_properties = r[properties_symbol] 
      if (l_properties === undefined && r_properties === undefined) {
        const l_keys = Object.keys(l)
        const r_keys = Object.keys(r)
        if (l_keys.length !== r_keys.length) {
          return false
        } else {
          for (let k of l_keys) {
            if (!equal(l[k], r[k])) return false
          }
          return true
        }
      } else if (l_properties !== undefined && r_properties !== undefined) {
        return l_properties.type.equal(l, r)
      } else {
        if (l_properties === undefined) {
          throw new Error(`l_properties is undefined, r_properties is defined`)
        } else {
          throw new Error(`l_properties is defined, r_properties is undefined`)
        }
      }
    }
  }
}

export const match = (o, cases) => {
  const o_properties = o[properties_symbol]
  if (o_properties === undefined) {
    throw new Error(`Expected properties symbol`)
  } else {
    const tag = o_properties.tag
    const c = cases[tag]
    const field_names = o_properties.type[properties_symbol].definition[tag]
    const field_values = field_names.map(field_name => o[field_name])
    if (c === undefined) {
      if (cases['Else'] === undefined) {
        throw new Error(`Expected tag to be one of [${Object.keys(cases)}], got "${tag}"`)
      } else {
        return cases['Else'](...field_values)
      }
    } else {
      return c(...field_values)
    }
  }
}


// assume types are equal
export const tags_equal = (l, r) => {
  return l[properties_symbol].tag === r[properties_symbol].tag
}

// partially applies function with o, then adds this function to o
const add_methods = (o, methods) => {
  for (let [method_name, method] of Object.entries(methods)) {
    o[method_name] = method.bind(null, o)
  }
}

// things only make sense when the values have the same type
export const SAdt = (name, definition, methods) => {
  const type = {
    [properties_symbol]: {
      name: name,
      definition: definition,
    },
    // type equal should not be used directly. it is used by equal
    // defaults to structural equal
    equal: (l, r) => {
      const l_properties = l[properties_symbol]
      const r_properties = r[properties_symbol]
      const l_type = l_properties.type
      const r_type = r_properties.type
      if (l_type !== r_type) {
        throw new Error(`Expected "${l_type[properties_symbol].name}", got "${r_type[properties_symbol].name}"`)
      } else {
        const l_tag = l_properties.tag
        const r_tag = r_properties.tag
        if (l_tag !== r_tag) {
          return false
        } else {
          const field_names = l_type[properties_symbol].definition[l_tag]
          for (let field_name of field_names) {
            if (!equal(l[field_name], r[field_name])) return false
          }
          return true
        }
      }
    }
  }
  for (let [tag, field_names] of Object.entries(definition)) {
    if (field_names.length === 0) {
      const value = {
        [properties_symbol]: {
          type: type,
          tag: tag,
        }
      }
      add_methods(value, methods)
      type[tag] = value
    } else {
      type[tag] = (...args) => {
        const value = {
          [properties_symbol]: {
            type: type,
            tag: tag,
          }
        }
        for (let i = 0; i < field_names.length; ++i) {
           value[field_names[i]] = args[i]
        }
        add_methods(value, methods)
        return value
      }
    }
  }
  return type
}


// impure
export const with_equal = (adt, f) => {
  adt.equal = (left, right) => {
    if (left.type !== adt.type) {
      throw new Error(`Expected type "${adt.type}", got ${left.type} at ${info_to_string(left.info)}`)
    } else if (right.type !== adt.type) {
      throw new Error(`Expected type "${adt.type}", got ${right.type} at ${info_to_string(right.info)}`)
    } else {
      const tags = Object.keys(adt)
      if (!tags.includes(left.tag)) {
        throw new Error(`Unknown tag ${left.tag} at ${info_to_string(left.info)}`)
      } else if (!tags.includes(right.tag)) {
        throw new Error(`Unknown tag ${right.tag} at ${info_to_string(right.info)}`)
      } else if (left.tag === right.tag) {
        return f(left, right)
      } else {
        return false
      }
    }
  }
}

