const util = require('util')
import {
  SAdt,
  match,
  equal,
  properties_symbol,
  tags_equal,
} from '../../src/adt'

const info_to_string = info => `${info[0]}:${info[1]}`

// Type = 
//   Bool
// | Function (Type, Type)
export const Type = SAdt('Type', {
  Bool: ['info'],
  Fn: ['info', 'input', 'output'],
}, {})

// Binding =
//   Name (name: String)
// | Type (name: String, type: Type)
export const Binding = SAdt('Binding', {
  Name: ['name'],
  Type: ['name', 'type']
}, {})

// NamingContext = [(Nat, Binding)]
// (NamingContext, Nat) -> Type
export const get_index_type = (naming_context, index) => {
  for (let i = naming_context.length - 1; i > 0; --i) {
    const [binding_index, binding] = naming_context[i]
    if (binding_index === index) {
      return match(binding, {
        Type: (name, type) => type,
      })
    }
  }
  throw new Error(`Cound not find ${index} in ${naming_context}`)
}

// Info = Info (start : Position, length: Nat)

// Term =
//   Var (info : Info, name : String) 
// | Abs (info : Info, var_name : String, var_type : Type, scope: Term)
// | App (info : Info, left : Term, right : Term)
export const Term = SAdt('Term', {
  Var: ['info', 'name'],
  Abs: ['info', 'var_name', 'var_type', 'scope'],
  App: ['info', 'abs', 'arg'],
}, {
  to_debruijn: (term, naming_context) => {
    return match(term, {
      Var: (info, name) => {
        const index = last_index_of_name(naming_context, name)
        return DTerm.Var(info, index)
      },
      Abs: (info, var_name, var_type, scope) => {
        const updated_naming_context = [...naming_context, Binding.Type(var_name, var_type)]
        return DTerm.Abs(info, var_name, var_type, scope.to_debruijn(updated_naming_context))
      },
      App: (info, abs, arg) => {
        return DTerm.App(info, abs.to_debruijn(naming_context), arg.to_debruijn(naming_context))
      }
    })
  }
})

const is_value = term => term[properties_symbol].tag === 'Abs'

// DebruijnTerm =
//   DVar (info : Info, index : Nat) 
// | DAbs (info : Info, var_name : String, var_type : Type, scope : DebruijnTerm)
// | DApp (info : Info, abs : DebruijnTerm, arg : DebruijnTerm)
export const DTerm = SAdt('DTerm', {
  Var: ['info', 'index'],
  Abs: ['info', 'var_name', 'var_type', 'scope'],
  App: ['info', 'abs', 'arg'],
}, {
  get_type: (term, naming_context) => {
    return match(term, {
      Var: (info, index) => get_type_from_naming_context(naming_context, index),
      Abs: (info, var_name, var_type, scope) => {
        const updated_naming_context = add_binding_to_naming_context(naming_context, Binding.Type(var_name, var_type))
        // source info is abs source info?
        return Type.Fn(info, var_type, scope.get_type(updated_naming_context))
      },
      App: (info, abs, arg) => {
        const abs_type = abs.get_type(naming_context)
        const arg_type = arg.get_type(naming_context)
        if (abs_type.input[properties_symbol].tag !== arg_type[properties_symbol].tag) {
          throw new Error(`Expected tag ${abs_type.input.tag}, got "${arg_type.tag}"`)
        } else {
          return arg_type
        }
      }
    })
  },
  shift: (term, d, c) => {
    return match(term, {
      Var: (info, index) => {
        if (index < c) {
          return term
        } else {
          return DTerm.Var(info, index + d)
        }
      },
      Abs: (info, var_name, var_type, scope) => {
        return DTerm.Abs(info, var_name, var_type, scope.shift(d, c + 1))
      },
      App: (info, abs, arg) => {
        return DTerm.App(info, abs.shift(d, c), arg.shift(d, c))
      }
    })
  },
  substitute: (term, i, s) => {
    return match(term, {
      Var: (info, index) => index === i ? s : term,
      Abs: (info, var_name, var_type, scope) => DTerm.Abs(info, var_name, var_type, scope.substitute(i + 1, s.shift(1, 0))),
      App: (info, abs, arg) => DTerm.App(info, abs.substitute(i, s), arg.substitute(i, s))
    })
  },
  evaluate_step: term => {
    return match(term, {
      App: (info, abs, arg) => {
        if (!is_value(abs)) {
          const [changed, reduced] = abs.evaluate_step()
          return [changed, DTerm.App(info, reduced, arg)]
        } else if (!is_value(arg)) {
          const [changed, reduced] = arg.evaluate_step()
          return [changed, DTerm.App(info, abs, reduced)]
        } else {
          return [true, abs.substitute(0, arg.shift(1, 0)).shift(-1, 0)]
        }
      },
      Else: () => [false, term]
    })
  },
  evaluate: term => {
    let [changed, next_term] = term.evaluate_step()
    while (changed) {
      [changed, next_term] = next_term.evaluate_step()
    }
    return next_term
  }
})

export const get_type_from_naming_context = (naming_context, index) => {
  const binding = naming_context[naming_context.length - 1 - index]
  return match(binding, {
    Type: (name, type) => type
  })
}

export const add_binding_to_naming_context = (naming_context, binding) => {
  return [...naming_context, binding]
}

export const last_index_of_name = (naming_context, name) => {
  for (var i = 0; i < naming_context.length; ++i) {
    const binding = naming_context[i]
    if (binding.name === name) break;
  }
  const index = naming_context.length - 1 - i
  if (index < 0) {
    throw new Error(`Expected "${name}" in ${naming_context}`)
  } else {
    return index
  }
}
