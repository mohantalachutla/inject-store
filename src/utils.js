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

export const setGlobal = (key, value) => {
  if (isBrowser()) {
    console.debug(`setGlobal: window ${key}`, value)
    window[key] = value
  } else if (isGlobal()) {
    console.debug(`setGlobal: globalThis ${key}`, value)
    globalThis[key] = value
  } else throw new Error('No global object found')
}

export const getGlobal = (key) => {
  if (isBrowser()) {
    return window[key]
  } else if (isGlobal()) {
    return globalThis[key]
  } else throw new Error('No global object found')
}

export const entries = (obj) => Object.entries(obj)
export const keys = (obj) => Object.keys(obj)
export const values = (obj) => Object.values(obj)
