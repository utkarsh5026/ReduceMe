import { Draft, produce } from "immer";

/**
 * Represents an action object in a our state management system.
 * @template T The type of the payload (optional).
 * @property {string} type The action type, used to identify the action.
 * @property {T} [payload] Optional payload containing additional data for the action.
 * @example
 * const incrementAction: Action<number> = { type: 'INCREMENT', payload: 1 };
 */
type Action<T = any> = {
  type: string;
  payload: T;
};

/**
 * Represents a reducer function that takes the current state and an action, and returns a new state.
 * @template T The type of the state.
 * @param {T} state The current state.
 * @param {Action} action The action to be processed.
 * @returns {T} The new state after processing the action.
 * @example
 * const counterReducer: Reducer<number> = (state, action) => {
 *   switch (action.type) {
 *     case 'INCREMENT':
 *       return state + 1;
 *     case 'DECREMENT':
 *       return state - 1;
 *     default:
 *       return state;
 *   }
 * };
 */
type Reducer<T> = (state: T | undefined, action: Action) => T;

/**
 * Represents a function that creates an action object.
 * @template P The type of the payload (void if no payload).
 * @returns {Action<P>} An action object with the appropriate type and payload.
 * @example
 * // Action creator without payload
 * const increment: ActionCreator = () => ({ type: 'INCREMENT' });
 *
 * // Action creator with payload
 * const addTodo: ActionCreator<string> = (text) => ({ type: 'ADD_TODO', payload: text });
 */
type ActionCreator<P = void> = P extends void
  ? () => Action<void>
  : (payload: P) => Action<P>;

/**
 * Represents a case reducer function that handles a specific action type.
 * It can either mutate the draft state (using Immer) or return a new state.
 * @template StateType The type of the state.
 * @template ActionType The type of the action, extending the base Action type.
 * @param {Draft<StateType>} draftState The draft state that can be mutated.
 * @param {ActionType} incomingAction The action to be processed.
 * @returns {void | StateType} Nothing if the draft state is mutated, or a new state object.
 * @example
 * const addTodo: CaseReducerFunction<TodoState, Action<string>> = (draftState, incomingAction) => {
 *   draftState.todos.push({ id: Date.now(), text: incomingAction.payload, completed: false });
 * };
 */
type CaseReducerFunction<StateType, ActionType extends Action> = (
  draftState: Draft<StateType>,
  incomingAction: ActionType
) => void | StateType;

/**
 * Represents a collection of case reducers for a slice of the state.
 * Each property is a case reducer function corresponding to a specific action type.
 * @template SliceState The type of the slice state.
 * @example
 * interface CounterState { value: number }
 *
 * const counterReducers: SliceCaseReducerMap<CounterState> = {
 *   increment: (draftState) => { draftState.value += 1; },
 *   decrement: (draftState) => { draftState.value -= 1; },
 *   incrementByAmount: (draftState, incomingAction: Action<number>) => {
 *     draftState.value += incomingAction.payload;
 *   },
 * };
 */
type SliceCaseReducerMap<SliceState> = {
  [actionType: string]: CaseReducerFunction<SliceState, Action<any>>;
};

/**
 * Represents a listener function that is called when the state changes.
 * This function takes no arguments and returns nothing.
 */
type Listener = () => void;

/**
 * Generates a map of action creators from a given SliceCaseReducerMap.
 * This type maps each key in the reducer map to an ActionCreator with the appropriate payload type.
 *
 * @template C The type of the SliceCaseReducerMap.
 *
 * @example
 * const reducers: SliceCaseReducerMap<MyState> = {
 *   increment: (state) => { state.value++ },
 *   addAmount: (state, action: Action<number>) => { state.value += action.payload }
 * };
 *
 * type MyActionCreators = ActionCreatorsFromCaseReducers<typeof reducers>;
 * // Result:
 * // {
 * //   increment: ActionCreator<void>,
 * //   addAmount: ActionCreator<number>
 * // }
 */
type ActionCreatorsFromCaseReducers<C extends SliceCaseReducerMap<any>> = {
  [K in keyof C]: C[K] extends (state: any) => any
    ? ActionCreator<void>
    : C[K] extends (state: any, action: infer A) => any
    ? A extends Action<infer P>
      ? ActionCreator<P>
      : never
    : never;
};