import { createSlice } from "../src/slice";
import type { Action } from "../src/types";

describe("createSlice", () => {
  interface State {
    value: number;
  }

  const initialState: State = { value: 0 };

  const slice = createSlice({
    name: "counter",
    initialState: initialState,
    reducers: {
      increment: (state: State) => {
        state.value += 1;
      },
      decrement: (state: State) => {
        state.value -= 1;
      },
      addByAmount: (state: State, action: Action) => {
        state.value += action.payload;
      },
    },
  });

  it("should return the correct slice name", () => {
    expect(slice.name).toBe("counter");
  });

  it("should initialize with the correct initial state", () => {
    const state = slice.reducer(undefined, { type: "", payload: {} });
    expect(state).toEqual(initialState);
  });

  it("should handle increment action", () => {
    const state = slice.reducer(initialState, slice.actions.increment());
    expect(state.value).toBe(1);
  });

  it("should handle decrement action", () => {
    const state = slice.reducer({ value: 1 }, slice.actions.decrement());
    expect(state.value).toBe(0);
  });

  it("should handle addByAmount action", () => {
    const state = slice.reducer(initialState, slice.actions.addByAmount(5));
    expect(state.value).toBe(5);
  });

  it("should handle addByAmount action with negative value", () => {
    const state = slice.reducer(initialState, slice.actions.addByAmount(-5));
    expect(state.value).toBe(-5);
  });

  it("should handle multiple increment actions", () => {
    let state = slice.reducer(initialState, slice.actions.increment());
    state = slice.reducer(state, slice.actions.increment());
    expect(state.value).toBe(2);
  });

  it("should handle multiple decrement actions", () => {
    let state = slice.reducer({ value: 2 }, slice.actions.decrement());
    state = slice.reducer(state, slice.actions.decrement());
    expect(state.value).toBe(0);
  });

  it("should handle a sequence of actions", () => {
    let state = slice.reducer(initialState, slice.actions.increment());
    state = slice.reducer(state, slice.actions.addByAmount(3));
    state = slice.reducer(state, slice.actions.decrement());
    expect(state.value).toBe(3);
  });

  it("should not mutate the state directly", () => {
    const stateBefore = { value: 0 };
    const stateAfter = slice.reducer(stateBefore, slice.actions.increment());
    expect(stateBefore).not.toBe(stateAfter);
  });
});

describe("createSlice with complex state", () => {
  interface ComplexState {
    counter: {
      value: number;
      history: number[];
    };
    metadata: {
      lastUpdated: string | null;
    };
  }

  const initialComplexState: ComplexState = {
    counter: { value: 0, history: [] },
    metadata: { lastUpdated: null },
  };

  const complexSlice = createSlice({
    name: "complexCounter",
    initialState: initialComplexState,
    reducers: {
      increment: (state: ComplexState) => {
        state.counter.value += 1;
        state.counter.history.push(state.counter.value);
        state.metadata.lastUpdated = new Date().toISOString();
      },
      reset: (state: ComplexState) => {
        state.counter.value = 0;
        state.counter.history = [];
        state.metadata.lastUpdated = new Date().toISOString();
      },
    },
  });

  it("should handle increment action and update history and metadata", () => {
    const state = complexSlice.reducer(
      initialComplexState,
      complexSlice.actions.increment()
    );
    expect(state.counter.value).toBe(1);
    expect(state.counter.history).toEqual([1]);
    expect(state.metadata.lastUpdated).not.toBeNull();
  });

  it("should handle reset action and clear history", () => {
    let state = complexSlice.reducer(
      initialComplexState,
      complexSlice.actions.increment()
    );
    state = complexSlice.reducer(state, complexSlice.actions.reset());
    expect(state.counter.value).toBe(0);
    expect(state.counter.history).toEqual([]);
    expect(state.metadata.lastUpdated).not.toBeNull();
  });
});
