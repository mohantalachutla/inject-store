import { configureStore, combineReducers } from '@reduxjs/toolkit'
import {
  getGlobal,
  isBrowser,
  isEmpty,
  isFunction,
  isObject,
  setGlobal,
  values,
} from './utils'
import { __REDUX_STORE__, SAGA_MIDDLEWARE } from './constants'

/**
 * Checks if the given store is valid.
 *
 * A store is considered valid if it has `dispatch`, `getState` and `subscribe` methods.
 *
 * @param {Object} store - The store to check.
 * @returns {boolean} true if the store is valid, false otherwise.
 */
const isStoreValid = function (store, middlewares = {}) {
  if (isEmpty(store)) return false
  let valid =
    store &&
    store.dispatch &&
    isFunction(store.dispatch) &&
    store.getState &&
    isFunction(store.getState) &&
    store.subscribe &&
    isFunction(store.subscribe) &&
    store.replaceReducer &&
    isFunction(store.replaceReducer)

  valid = valid && !isEmpty(store.runningReducers)
  // if(!isEmpty(middlewares) && !isEmpty(store.middlewares)){}
  // let storedMiddlewares = store.middlewares
  // valid &&
  //   middlewares.forEach((middleware) => {
  //     valid = valid && storedMiddlewares.includes(middleware)
  //   })
  if (valid) {
    return true
  }
  console.error('Invalid store')
  return false
}

/**
 * Returns a set of methods to inject sagas into the given store.
 *
 * @param {Object} store - The store to inject sagas into.
 * @param {Function} runSaga - A function to run the saga with.
 *
 * The methods are:
 * - `injectSaga(key, saga)`: Injects a saga into the store, assigning it the given key.
 * - `getSaga(key)`: Returns a saga by its key.
 * - `cancelSaga(key)`: Cancels a saga by its key.
 *
 * Each saga is stored on the store under the `runningSagas` property.
 *
 * @throws {Error} If the store is not valid.
 * @throws {Error} If the runSaga function is not valid.
 */
const createInjectSaga = (store, runSaga) => {
  if (!isStoreValid(store)) {
    throw new Error('Store is not valid')
  }
  if (!isFunction(runSaga)) {
    throw new Error('runSaga is not a function')
  }
  if (store.runningSagas === undefined) store.runningSagas = {}
  const getSaga = (key) => store.runningSagas[key]
  const injectSaga = (key, saga) => {
    if (store.runningSagas[key]) return store.runningSagas[key]
    store.runningSagas[key] = runSaga(saga)
    return store.runningSagas[key]
  }
  const cancelSaga = (key) => {
    if (store.runningSagas[key]) {
      store.runningSagas[key].cancel()
      delete store.runningSagas[key]
    }
  }
  store.injectSaga = injectSaga
  store.getSaga = getSaga
  store.cancelSaga = cancelSaga
  return { injectSaga, getSaga, cancelSaga }
}

/**
 * Returns a set of methods to inject reducers into the given store.
 *
 * @param {Object} store - The store to inject reducers into.
 * @returns {Object} An object with the following methods:
 * - `injectReducer(key, reducer)`: Injects a single reducer into the store.
 * - `getReducer(key)`: Returns a reducer by its key.
 * - `cancelReducer(key)`: Cancels a reducer by its key.
 * - `injectReducers(reducers)`: Injects multiple reducers at once.
 *
 * The reducers are combined with the existing reducers in the store using
 * `combineReducers` from `redux`.
 *
 * Each reducer is stored on the store under the `runningReducers` property.
 *
 * @throws {Error} If the store is not valid.
 */
const createInjectReducer = (store) => {
  if (!isStoreValid(store)) {
    throw new Error('Store is not valid')
  }
  if (store.runningReducers === undefined) store.runningReducers = {}
  const getReducer = (key) => store.runningReducers[key]
  const injectReducer = (key, reducer) => {
    if (isEmpty(reducer)) return
    if (isEmpty(key)) return
    if (store.runningReducers[key]) return store.runningReducers[key]
    if (typeof reducer !== 'function')
      throw new Error('Reducer must be a function')
    store.runningReducers[key] = reducer
    const reducers = { ...(store.runningReducers ?? {}), ...noopReducer }
    store.replaceReducer(combineReducers(reducers))
    return store.runningReducers[key]
  }
  const cancelReducer = (key) => {
    if (store.runningReducers[key]) {
      delete store.runningReducers[key]
      const reducers = { ...(store.runningReducers ?? {}), ...noopReducer }
      store.replaceReducer(combineReducers(reducers))
    }
  }
  const injectReducers = (reducers) => {
    if (!isObject(reducers)) {
      throw new Error('Expected object, provided ' + typeof reducers)
    }
    Object.entries(reducers).forEach(([key, value]) => {
      injectReducer(key, value)
    })
  }
  store.injectReducer = injectReducer
  store.injectReducers = injectReducers
  store.cancelReducer = cancelReducer
  store.getReducer = getReducer
  return { injectReducer, getReducer, cancelReducer, injectReducers }
}

const noopReducer = { _noop: (state = {}) => state }

/**
 * Creates a Redux store with the given middlewares.
 *
 * If a global Redux store exists and is valid, it is returned.
 * Otherwise, a new store is created with the given middlewares.
 *
 * The store is stored on the global object under the `__REDUX_STORE__` key.
 *
 * If the Redux DevTools browser extension is installed, it is enabled.
 *
 * The `injectReducer` and `injectSaga` methods are added to the store.
 *
 * @param {Object} [options={}] - An options object.
 * @param {Object} [options.middlewares={}] - An object of middlewares to use.
 * Each middleware is either a function or an object with a `run` method.
 * @returns {Object} The created Redux store.
 */
export const createReduxStore = ({ middlewares = {} }) => {
  if (!isBrowser()) console.warn('\n\n\nNo window object found.\n\n\n')
  values(middlewares).forEach((middleware) => {
    if (!isObject(middleware) && !isFunction(middleware)) {
      throw new Error('Middleware is not a function or an object')
    }
  })
  const existingStore = getGlobal(__REDUX_STORE__)
  if (!isEmpty(existingStore)) {
    if (!isStoreValid(existingStore, middlewares)) {
      throw new Error(
        'Existing store is not valid or does not match existing middlewares'
      )
    }
    return existingStore
  }
  const store = configureStore({
    reducer: noopReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat([
        ...values(middlewares),
      ]),
  })
  store.runningReducers = noopReducer
  store.middlewares = middlewares
  if (!isStoreValid(store)) {
    throw new Error('Failed to create store')
  }
  setGlobal(__REDUX_STORE__, store)
  if (window?.__REDUX_DEVTOOLS_EXTENSION__) {
    window.__REDUX_DEVTOOLS_EXTENSION__()
  }
  createInjectReducer(store)
  if (middlewares[SAGA_MIDDLEWARE] && middlewares[SAGA_MIDDLEWARE].run) {
    createInjectSaga(store, middlewares[SAGA_MIDDLEWARE].run)
  }
  return store
}
