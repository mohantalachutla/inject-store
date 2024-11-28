import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { isBrowser, isFunction, isGlobal, isObject } from './utils'

/**
 * Checks if the given store is valid.
 *
 * A store is considered valid if it has `dispatch`, `getState` and `subscribe` methods.
 *
 * @param {Object} store - The store to check.
 * @returns {boolean} true if the store is valid, false otherwise.
 */
const isStoreValid = function (store) {
  if (store && store?.dispatch && store?.getState && store?.subscribe) {
    return true
  }
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
export const createInjectSaga = (store, runSaga) => {
  if (!isStoreValid(store)) {
    throw new Error('Store is not valid')
  }
  if (!isFunction(runSaga)) {
    throw new Error('runSaga is not a function')
  }
  store.runningSagas = {}
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
export const createInjectReducer = (store) => {
  if (!isStoreValid(store)) {
    throw new Error('Store is not valid')
  }
  store.runningReducers = {}
  const getReducer = (key) => store.runningReducers[key]
  const injectReducer = (key, reducer) => {
    if (store.runningReducers[key]) return store.runningReducers[key]
    if (typeof reducer !== 'function')
      throw new Error('Reducer must be a function')
    store.runningReducers[key] = reducer
    store.replaceReducer(combineReducers(store.runningReducers))
    return store.runningReducers[key]
  }
  const cancelReducer = (key) => {
    if (store.runningReducers[key]) {
      delete store.runningReducers[key]
      store.replaceReducer(combineReducers(store.runningReducers))
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

/**
 * Creates a new Redux store instance with the given middleware.
 *
 * If the global `__REDUX_STORE__` variable is set, it returns that store.
 * Otherwise, it creates a new store and assigns it to `__REDUX_STORE__`.
 *
 * @param {Object} options - An object with the following properties:
 * - `middlewares`: An array of Redux middleware functions.
 * @returns {Store} The Redux store instance.
 * @throws {Error} If the store is not created successfully.
 */
export const createReduxStore = ({ middlewares = [] }) => {
  if (!isBrowser()) console.warn('\n\n\nNo window object found.\n\n\n')
  if (window?.__REDUX_STORE__ && isStoreValid(window.__REDUX_STORE__)) {
    return window.__REDUX_STORE__
  }
  middlewares.forEach((middleware) => {
    if (!isObject(middleware) && !isFunction(middleware)) {
      throw new Error('Middleware is not a function or an object')
    }
  })
  const store = configureStore({
    reducer: {},
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat([
        ...middlewares,
      ]),
  })
  if (!isStoreValid(store)) {
    throw new Error('Failed to create store')
  }
  store.middlewares = middlewares
  if (isBrowser()) {
    window.__REDUX_STORE__ = store
  }
  if (isGlobal()) {
    globalThis.__REDUX_STORE__ = store
  }
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  return store
}
