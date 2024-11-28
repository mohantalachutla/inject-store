## This is a inject-store library to configure sychroinized state using Redux


## Installation
#### Install inject-store and peer dependencies

```bash
npm install redux
npm install @reduxjs/toolkit
npm install @mohantalachutla/inject-store
```

## Usage
#### Import createReduxStore to configure Redux store
```javascript
import {createReduxStore} = require("@mohantalachutla/inject-store");
const store = createReduxStore();
```

#### Inject reducers
```javascript
const store = createReduxStore();
const {injectReducer} = createInjectReducer(store);
injectReducer("counter", counterReducer);
injectReducer("user", userReducer);

// cancel reducer
store.cancelReducer("counter");
```
#### or 
```javascript
const store = createReduxStore();
const { injectReducers } = createInjectReducer(store);
injectReducers({
  counter: counterReducer,
  user: userReducer,
});
```

#### Inject sagas
```javascript
import {createSagaMiddleware} from "redux-saga";
const sagaMiddleware = createSagaMiddleware();
const {injectSaga} = createInjectSaga(store, sagaMiddleware.run);
const counter = injectSaga("counter", counterSaga);
const user = injectSaga("user", userSaga);


// cancel sagas
store.cancelSaga("counter");
store.cancelSaga("user");
```