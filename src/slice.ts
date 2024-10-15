import { produce } from "immer";
import type {
  Action,
  CreateAction,
  ActionHandler,
  ReducerMap,
  GenerateActionCreators,
  StateReducerConfig,
} from "./types";

/**
 * Options for creating a slice.
 * @template S The type of the slice state.
 * @template C The type of the case reducers, extending SliceCaseReducerMap<S>.
 */
interface CreateSliceOptions<S, C extends ReducerMap<S>> {
  name: string;
  initialState: S;
  reducers: C;
  extraReducers?: (builder: ReducerBuilder<S>) => void;
}

/**
 * Represents a slice of the Redux store.
 * @template S The type of the slice state.
 * @template C The type of the case reducers, extending SliceCaseReducerMap<S>.
 */
interface Slice<S, C extends ReducerMap<S>> {
  name: string;
  reducer: StateReducerConfig<S>;
  actions: GenerateActionCreators<C>;
}

/**
 * Creates a slice of the Redux store.
 *
 * @template S The type of the slice state.
 * @template C The type of the case reducers, extending SliceCaseReducerMap<S>.
 * @param {CreateSliceOptions<S, C>} options The options for creating the slice.
 * @returns {Slice<S, C>} The created slice.
 *
 * @example
 * const counterSlice = createSlice({
 *   name: 'counter',
 *   initialState: { value: 0 },
 *   reducers: {
 *     increment: (state) => { state.value += 1 },
 *     decrement: (state) => { state.value -= 1 },
 *     incrementByAmount: (state, action: Action<number>) => {
 *       state.value += action.payload
 *     },
 *   },
 * })
 *
 * // Use the created slice
 * const { actions, reducer } = counterSlice
 * const { increment, decrement, incrementByAmount } = actions
 *
 * // Dispatch actions
 * dispatch(increment())
 * dispatch(decrement())
 * dispatch(incrementByAmount(5))
 *
 * // Use the reducer
 * const nextState = reducer(currentState, increment())
 */
export function createSlice<S, C extends ReducerMap<S>>(
  options: CreateSliceOptions<S, C>
): Slice<S, C> {
  const { name, initialState, reducers, extraReducers } = options;
  const actionCreators: Record<string, CreateAction<any>> = {};
  const actionHandlers: Record<string, ActionHandler<S, Action>> = {};

  // Create action creators and case reducers
  Object.keys(reducers).forEach((reducerName) => {
    const actionType = `${name}/${reducerName}`;
    actionHandlers[actionType] = reducers[reducerName];
    actionCreators[reducerName] = ((payload?: any) => ({
      type: actionType,
      payload,
    })) as CreateAction<any>;
  });

  const builder = new ReducerBuilder<S>();
  if (extraReducers) {
    extraReducers(builder);
    Object.assign(actionHandlers, builder.build());
  }

  // Create the main reducer function
  const reducer = (state: S = initialState, action: Action): S => {
    const handler = actionHandlers[action.type];
    if (handler)
      return produce(state, (draftState) => {
        handler(draftState, action);
      });

    for (const key in actionHandlers) {
      if (key === ReducerBuilder.DEFAULT_ACTION_TYPE) {
        const result = produce(state, (draftState) => {
          actionHandlers[ReducerBuilder.DEFAULT_ACTION_TYPE](
            draftState,
            action
          );
        });
        if (result !== state) return result;
      }
    }

    return state;
  };

  return {
    name,
    reducer: { initialState, reducer },
    actions: actionCreators as GenerateActionCreators<C>,
  };
}

/**
 * A builder class for constructing reducers with extra cases and a default case.
 * @template State The type of the state managed by the reducer.
 */
class ReducerBuilder<State> {
  /** The action type used for the default case. */
  static DEFAULT_ACTION_TYPE = "DEFAULT";

  /** A record of extra reducers, keyed by action type. */
  private extraReducers: Record<string, ActionHandler<State, Action<any>>> = {};

  /**
   * Adds a case to the builder for a specific action.
   * @template P The type of the action payload.
   * @param actionCreator A function that creates an action of type P.
   * @param reducer A function that handles the state change for this action.
   * @returns The builder instance for chaining.
   */
  addCase<P = any>(
    actionCreator: CreateAction<P>,
    reducer: ActionHandler<State, Action<P>>
  ): ReducerBuilder<State> {
    const type = actionCreator({} as P).type;
    this.extraReducers[type] = reducer;
    return this;
  }

  /**
   * Builds and returns the final record of extra reducers.
   * @returns A record of action handlers, keyed by action type.
   */
  build(): Record<string, ActionHandler<State, Action<any>>> {
    return this.extraReducers;
  }

  /**
   * Adds a default case to the builder.
   * @param reducer A function that handles the state change for any unmatched action.
   * @returns The builder instance for chaining.
   */
  addDefaultCase(
    reducer: ActionHandler<State, Action<any>>
  ): ReducerBuilder<State> {
    this.extraReducers[ReducerBuilder.DEFAULT_ACTION_TYPE] = reducer;
    return this;
  }
}
