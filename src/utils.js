export const isEmpty = (value) => {
  if (value === undefined || value === null || value === '') {
    return true
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }
  return false
}

export const isFunction = (value) => {
  return typeof value === 'function'
}

export const isString = (value) => {
  return typeof value === 'string'
}

export const isNumber = (value) => {
  return typeof value === 'number'
}

export const isObject = (value) => {
  return typeof value === 'object'
}

const isArray = (value) => {
  return Array.isArray(value)
}

export const isBrowser = () => typeof window !== 'undefined'
export const isGlobal = () => typeof globalThis !== 'undefined'
