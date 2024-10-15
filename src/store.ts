import type {
  StateReducerConfig,
  StateChangeListener,
  Action,
  StateReducer,
  Middleware,
  MiddlewareAPI,
  DispatchAction,
} from "./types";

type ReducersMapObject = { [key: string]: StateReducerConfig<any> };

/**
 * Represents a Redux-like store that manages application state.
 * @template State The type of the state managed by the store.
 */
export class Store<State> {
  private _state: State;
  private readonly _reducer: StateReducer<State>;
  private readonly _dispatch: DispatchAction;
  private _listeners: Set<StateChangeListener> = new Set();
  private _isDispatching = false;

  /**
   * Creates a new Store instance.
   * @param reducer The root reducer function.
   * @param initialState The initial state of the store.
   * @param middlewares An array of middleware functions to apply.
   * @private
   */
  private constructor(
    reducer: StateReducer<State>,
    initialState: State,
    middlewares: Middleware<State>[] = []
  ) {
    this._reducer = reducer;
    this._state = initialState;
    this._dispatch = this._baseDispatch.bind(this);

    if (middlewares.length > 0)
      this._dispatch = this._applyMiddleware(middlewares);
  }

  /**
   * Returns the current state of the store.
   * @returns A frozen copy of the current state.
   * @throws {Error} If called while dispatching an action.
   */
  state(): State {
    if (this._isDispatching) throw new Error("Cannot call when dispatching");
    return Object.freeze({ ...this._state });
  }

  /**
   * Creates a new Store instance with combined reducers.
   * @template M The type of the reducers map object.
   * @param reducers An object map of reducer functions.
   * @param middlewares An array of middleware functions to apply.
   * @returns A new Store instance.
   */
  static create<M extends ReducersMapObject>(
    reducers: M,
    middlewares: Middleware<any>[] = []
  ) {
    const reducer = combineReducers(reducers);
    type RootState = ReturnType<typeof reducer>;
    const initialState = Object.keys(reducers).reduce((acc, key) => {
      acc[key as keyof RootState] = reducers[key].initialState;
      return acc;
    }, {} as RootState);
    return new Store<RootState>(reducer, initialState, middlewares);
  }

  /**
   * Dispatches an action to the store.
   * @param action The action to dispatch.
   * @throws {Error} If called while already dispatching an action.
   */
  dispatch(action: Action<any>): void {
    this._dispatch(action);
  }

  /**
   * Registers a listener to be called after every action dispatch.
   * @param listener The listener function to register.
   * @returns A function to unregister the listener.
   */
  registerListener(listener: StateChangeListener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Dispatches an action to the store and updates the state.
   * This is the base dispatch method that actually applies the reducer to the state.
   *
   * @param action The action to dispatch.
   * @throws {Error} If called while already dispatching an action.
   *
   * @description
   * This method performs the following steps:
   * 1. Checks if an action is already being dispatched.
   * 2. Sets the dispatching flag to true.
   * 3. Applies the reducer to the current state with the given action.
   * 4. Updates the state with the result from the reducer.
   * 5. Sets the dispatching flag back to false.
   * 6. Notifies all registered listeners about the state change.
   */
  private _baseDispatch(action: Action<any>) {
    if (this._isDispatching)
      throw new Error("Reducers may not dispatch actions.");

    try {
      this._isDispatching = true;
      this._state = this._reducer(this._state, action);
    } finally {
      this._isDispatching = false;
    }

    this._listeners.forEach((listen) => listen());
  }

  /**
   * Composes multiple functions into a single function.
   * The functions are composed from right to left.
   *
   * @param {...Function} funcs - The functions to compose.
   * @returns {Function} A function that is the composition of the input functions.
   *
   * @example
   * const add1 = (x: number) => x + 1;
   * const double = (x: number) => x * 2;
   * const add1ThenDouble = this._compose(double, add1);
   * console.log(add1ThenDouble(3)); // Outputs: 8
   */
  private _compose(...funcs: Function[]): Function {
    if (funcs.length === 0) return (arg: any) => arg;

    if (funcs.length === 1) return funcs[0];

    return funcs.reduce(
      (a, b) =>
        (...args: any[]) =>
          a(b(...args))
    );
  }

  /**
   * Applies middleware to the store's dispatch function.
   *
   * @param middlewares An array of middleware functions to apply.
   * @returns A new dispatch function that incorporates the middleware.
   *
   * @description
   * This method takes an array of middleware functions and applies them to the store's dispatch.
   * It creates a chain of middleware, each having access to the store's state and dispatch,
   * and composes them into a single function. The resulting function enhances the base dispatch
   * with the middleware functionality.
   *
   * @example
   * const loggerMiddleware = store => next => action => {
   *   console.log('Dispatching', action);
   *   let result = next(action);
   *   console.log('Next state', store.state());
   *   return result;
   * };
   *
   * this._applyMiddleware([loggerMiddleware]);
   */
  private _applyMiddleware(middlewares: Middleware<State>[]): DispatchAction {
    const store: MiddlewareAPI<State> = {
      state: this.state.bind(this),
      dispatch: (action: Action) => this._dispatch(action),
    };

    const chain = middlewares.map((middleware) => middleware(store));
    const pipe = this._compose(...chain);
    return pipe(this._baseDispatch.bind(this));
  }
}

/**
 * Combines multiple reducers into a single reducer function.
 *
 * @template M The type of the reducers map object.
 * @param {M} reducers An object map of reducer functions.
 * @returns {Reducer<{ [K in keyof M]: M[K] extends Reduce<infer S> ? S : never }>} A single reducer function that combines all the input reducers.
 *
 * @example
 * const rootReducer = combineReducers({
 *   users: usersReducer,
 *   posts: postsReducer,
 * });
 */
export function combineReducers<M extends ReducersMapObject>(
  reducers: M
): StateReducer<{
  [K in keyof M]: M[K] extends StateReducerConfig<infer S> ? S : never;
}> {
  return (state: any = {}, action: Action<any>) => {
    const nextState: any = {};
    let hasChanged = false;

    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer.reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  };
}

/**
 * Dispatches an action to the given store.
 *
 * @template S The type of the store's state.
 * @param {Store<S>} store The store to dispatch the action to.
 * @param {Action<any>} action The action to dispatch.
 *
 * @example
 * dispatch(store, { type: 'INCREMENT' });
 */
export function dispatch<S>(store: Store<S>, action: Action<any>): void {
  store.dispatch(action);
}