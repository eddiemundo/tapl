
const util = require('util')
// Term :: Var ((Int, Int), String) 
//       | Abs ((Int, Int), String, Term)
//       | App ((Int, Int), Term, Term)
// DeBruijnTerm :: Var ((Int, Int), String) 
//       | Abs ((Int, Int), String, Term)
//       | App ((Int, Int), Term, Term)
export const create_var = (info, name) => ({
  type: 'var',
  info: info,
  name: name
})

export const create_abs = (info, src_var_name, scope) => ({
  type: 'abs',
  info: info,
  src_var_name: src_var_name,
  scope: scope
})

export const create_app = (info, lambda, argument) => ({
  type: 'app',
  info: info,
  lambda: lambda,
  argument: argument
})

export const create_debruijn_var = (info, index) => ({
  type: 'debruijn_var',
  info: info,
  index: index
})

export const infos_equal = (left_info, right_info) => {
  return left_info[0] === right_info[0] && left_info[1] === right_info[1]
}

export const terms_equal = (left_term, right_term) => {
  if (left_term.type === right_term.type && infos_equal(left_term, right_term)) {
    const type = left_term.type
    if (type === 'var') {
      return left_term.name === right_term.name
    } else if (type === 'abs') {
      return left_term.src_var_name === right_term.src_var_name && terms_equal(left_term.scope, right_term.scope)
    } else if (type === 'app') {
      return terms_equal(left_term.lambda, right_term.lambda) && terms_equal(left_term.argument, right_term.argument)
    } else {
      throw new Error(`Unexpected type ${type}`)
    }
  } else {
    return false
  }
}

export const debruijn_terms_equal = (left_term, right_term) => {
  if (left_term.type === right_term.type && infos_equal(left_term, right_term)) {
    const type = left_term.type
    if (type === 'debruijn_var') {
      return left_term.index === right_term.index
    } else if (type === 'abs') {
      return left_term.src_var_name === right_term.src_var_name && debruijn_terms_equal(left_term.scope, right_term.scope)
    } else if (type === 'app') {
      return debruijn_terms_equal(left_term.lambda, right_term.lambda) && debruijn_terms_equal(left_term.argument, right_term.argument)
    } else {
      throw new Error(`Unexpected type ${type}`)
    }
  } else {
    return false
  }
}

export const get_variable_names = term => {
  const go = term => {
    //console.log('Get variable names')
    if (term.type === 'var') {
      return [term.name]
    } else if (term.type === 'abs') {
      return go(term.scope)
    } else if (term.type === 'app') {
      return go(term.lambda).concat(go(term.argument))
    } else {
      throw new Error(`Unexpected term type, ${term.type}`)
    }
  }
  return [...new Set(go(term))]
}

export const convert_to_debruijn = (naming_context, term) => {
  //console.log('Convert to de Bruijn')
  if (term.type === 'var') {
    //console.log('Var')
    //console.log(naming_context)
    const index = naming_context.length - 1 - naming_context.lastIndexOf(term.name)
    return create_debruijn_var(term.info, index)
  } else if (term.type === 'abs') {
    //console.log('Abs')
    naming_context.push(term.src_var_name)
    //console.log(naming_context)
    const debruijn_abs = create_abs(term.info, term.src_var_name, convert_to_debruijn(naming_context, term.scope))
    naming_context.pop()
    return debruijn_abs
  } else if (term.type === 'app') {
    //console.log('App')
    //console.log(naming_context)
    return create_app(term.info, convert_to_debruijn(naming_context, term.lambda), convert_to_debruijn(naming_context, term.argument))
  }
}

// (DebruijnTerm, Int, Int) -> DebruijnTerm
export const shift_indices = (d, c, term) => {
  if (term.type === 'debruijn_var') {
    if (term.index < c) {
      return create_debruijn_var(term.info, term.index)
    } else {
      return create_debruijn_var(term.info, term.index + d)
    }
  } else if (term.type === 'abs') {
    return create_abs(term.info, term.src_var_name, shift_indices(d, c + 1, term.scope))
  } else if (term.type === 'app') {
    return create_app(term.info, shift_indices(d, c, term.lambda), shift_indices(d, c, term.argument))
  } else {
    throw new Error(`Unrecognized type ${term.type}`)
  }
}

// ((Int, DebruijnTerm), DebruijnTerm) -> DebruijnTerm
export const substitute = (j_to_s, term) => {
  const [index, s] = j_to_s
  if (term.type === 'debruijn_var') {
    if (term.index === index) return s
    else return term
  } else if (term.type === 'abs') {
    return create_abs(term.info, term.src_var_name, substitute([index + 1, shift_indices(1, 0, s)], term.scope))
  } else if (term.type === 'app') {
    return create_app(term.info, substitute(j_to_s, term.lambda), substitute(j_to_s, term.argument))
  } else {
    throw new Error(`Unrecognized type ${term.type}`)
  }
}

const is_value = term => term.type === 'abs'

// Debruijn_Term -> (WasRuleApplied, Debruijn_Term)
const evaluate_step = term => {
  if (term.type === 'app') {
    if (!is_value(term.lambda)) {
      const [changed, reduced] = evaluate_step(term.lambda)
      return [changed, create_app(term.info, reduced, term.argument)]
    } else if (!is_value(term.argument)) {
      const [changed, reduced] = evaluate_step(term.argument)
      return [changed, create_app(term.info, term.lambda, reduced)]
    } else {
      const j_to_s = [0, shift_indices(1, 0, term.argument)]
      return [true, shift_indices(-1, 0, substitute(j_to_s, term.lambda.scope))]
    }
  } else {
    return [false, term]
  }
}

const print_object = o => {
  console.log(util.inspect(o, {showHidden: false, depth: null}))
}
// DebruijnTerm -> DebruijnTerm
export const evaluate = term => {
  //print_object(term)
  let [was_rule_applied, next_term] = evaluate_step(term)
  //print_object(next_term)
  while (was_rule_applied) {
    [was_rule_applied, next_term] = evaluate_step(next_term)
  }
  return next_term
}
