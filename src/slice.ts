import { produce } from "immer";
import type {
  Action,
  CreateAction,
  ActionHandler,
  ReducerMap,
  ActionCreatorsFromCaseReducers,
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
  actions: ActionCreatorsFromCaseReducers<C>;
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
  const { name, initialState, reducers } = options;
  const actionCreators: Record<string, CreateAction<any>> = {};
  const caseReducers: Record<string, ActionHandler<S, Action>> = {};

  // Create action creators and case reducers
  Object.keys(reducers).forEach((key) => {
    const actionType = `${name}/${key}`;
    caseReducers[actionType] = reducers[key];
    actionCreators[key] = ((payload?: any) => ({
      type: actionType,
      payload,
    })) as CreateAction<any>;
  });

  // Create the main reducer function
  const reducer = (state: S = initialState, action: Action): S => {
    const handler = caseReducers[action.type];
    if (!handler) return state;
    return produce(state, (draftState) => {
      handler(draftState, action);
    });
  };

  return {
    name,
    reducer: { initialState, reducer },
    actions: actionCreators as ActionCreatorsFromCaseReducers<C>,
  };
}

class ReducerBuilder<State> {
  private extraReducers: Record<string, ActionHandler<State, Action<any>>> =
    {};

  addCase<P = any>(
    actionCreator: CreateAction<P>,
    reducer: ActionHandler<State, Action<P>>
  ): ReducerBuilder<State> {
    const type = actionCreator({} as P).type;
    this.extraReducers[type] = reducer;
    return this;
  }

  build(): Record<string, ActionHandler<State, Action<any>>> {
    return this.extraReducers;
  }

  addDefaultCase(
    reducer: ActionHandler<State, Action<any>>
  ): ReducerBuilder<State> {
    this.extraReducers["DEFAULT"] = reducer;
    return this;
  }
}