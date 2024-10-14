import type { Reduce, Listener, Action, Reducer } from "./types";

type ReducersMapObject = { [key: string]: Reduce<any> };

/**
 * Represents a Redux-like store that manages application state.
 * @template State The type of the state managed by the store.
 */
export class Store<State> {
  private _state: State;
  private _reducer: Reducer<State>;
  private _listeners: Set<Listener> = new Set();
  private _isDispatching = false;

  /**
   * Creates a new Store instance.
   * @param reducer The root reducer function.
   * @private
   */
  private constructor(reducer: Reducer<State>, initialState: State) {
    this._reducer = reducer;
    this._state = initialState;
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
   * @returns A new Store instance.
   */
  static create<M extends ReducersMapObject>(reducers: M) {
    const reducer = combineReducers(reducers);
    type RootState = ReturnType<typeof reducer>;
    const initialState = Object.keys(reducers).reduce((acc, key) => {
      acc[key as keyof RootState] = reducers[key].initialState;
      return acc;
    }, {} as RootState);
    return new Store<RootState>(reducer, initialState);
  }

  /**
   * Dispatches an action to the store.
   * @param action The action to dispatch.
   * @throws {Error} If called while already dispatching an action.
   */
  dispatch(action: Action<any>): void {
    if (this._isDispatching)
      throw new Error("Reducers may not dispatch actions.");

    try {
      this._isDispatching = true;
      this._state = this._reducer(this._state, action);
    } finally {
      this._isDispatching = false;
    }

    this._listeners.forEach((listener) => listener());
  }

  /**
   * Registers a listener to be called after every action dispatch.
   * @param listener The listener function to register.
   * @returns A function to unregister the listener.
   */
  registerListener(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
}

// Updated combineReducers function with inferred types
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
): Reducer<{
  [K in keyof M]: M[K] extends Reduce<infer S> ? S : never;
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
