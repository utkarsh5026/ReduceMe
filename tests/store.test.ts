import { createSlice } from "../src/slice";
import { Store } from "../src/store";
import type { Action, Middleware } from "../src/types";

// Define a slice for testing
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: Action<number>) => {
      state.value += action.payload;
    },
  },
});

// Define another slice for testing
const todoSlice = createSlice({
  name: "todos",
  initialState: { items: [] as string[] },
  reducers: {
    addTodo: (state, action: Action<string>) => {
      state.items.push(action.payload);
    },
    removeTodo: (state, action: Action<number>) => {
      state.items.splice(action.payload, 1);
    },
  },
});

describe("Store", () => {
  let store: Store<{ counter: { value: number } }>;

  beforeEach(() => {
    // Create a new store instance before each test
    store = Store.create({
      counter: counterSlice.reducer,
    });
  });

  test("should initialize with the correct state", () => {
    expect(store.state()).toEqual({ counter: { value: 0 } });
  });

  test("should handle increment action", () => {
    store.dispatch(counterSlice.actions.increment());
    expect(store.state()).toEqual({ counter: { value: 1 } });
  });

  test("should handle decrement action", () => {
    store.dispatch(counterSlice.actions.decrement());
    expect(store.state()).toEqual({ counter: { value: -1 } });
  });

  test("should handle incrementByAmount action", () => {
    store.dispatch(counterSlice.actions.incrementByAmount(5));
    expect(store.state()).toEqual({ counter: { value: 5 } });
  });

  test("should not mutate state directly", () => {
    const stateBefore = store.state();
    store.dispatch(counterSlice.actions.increment());
    const stateAfter = store.state();
    expect(stateBefore).not.toBe(stateAfter);
  });

  test("should notify listeners on state change", () => {
    const listener = jest.fn();
    store.registerListener(listener);

    store.dispatch(counterSlice.actions.increment());
    expect(listener).toHaveBeenCalledTimes(1);

    store.dispatch(counterSlice.actions.incrementByAmount(2));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("should allow unregistering listeners", () => {
    const listener = jest.fn();
    const unregister = store.registerListener(listener);

    store.dispatch(counterSlice.actions.increment());
    expect(listener).toHaveBeenCalledTimes(1);

    unregister();
    store.dispatch(counterSlice.actions.increment());
    expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
  });
});

describe("Store with multiple slices", () => {
  let store: Store<{ counter: { value: number }; todos: { items: string[] } }>;

  beforeEach(() => {
    // Create a new store instance with multiple slices before each test
    store = Store.create({
      counter: counterSlice.reducer,
      todos: todoSlice.reducer,
    });
  });

  test("should initialize with the correct state for multiple slices", () => {
    expect(store.state()).toEqual({
      counter: { value: 0 },
      todos: { items: [] },
    });
  });

  test("should handle actions from multiple slices", () => {
    store.dispatch(counterSlice.actions.increment());
    store.dispatch(todoSlice.actions.addTodo("Learn Redux"));
    expect(store.state()).toEqual({
      counter: { value: 1 },
      todos: { items: ["Learn Redux"] },
    });

    store.dispatch(todoSlice.actions.removeTodo(0));
    expect(store.state()).toEqual({
      counter: { value: 1 },
      todos: { items: [] },
    });
  });

  test("should notify listeners on state change for multiple slices", () => {
    const listener = jest.fn();
    store.registerListener(listener);

    store.dispatch(counterSlice.actions.increment());
    expect(listener).toHaveBeenCalledTimes(1);

    store.dispatch(todoSlice.actions.addTodo("Learn Redux"));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  // Add more tests as needed for the new slice
});

const testReducer = (state = { count: 0 }, action: Action<any>) => {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    default:
      return state;
  }
};

// A simple middleware for testing
const loggerMiddleware: Middleware<any> = (store) => (next) => (action) => {
  console.log("Dispatching:", action);
  const result = next(action);
  console.log("Next state:", store.state());
  return result;
};

// A middleware to test if it modifies the action
const modifyActionMiddleware: Middleware<any> = () => (next) => (action) => {
  const modifiedAction = { ...action, type: "INCREMENT" };
  return next(modifiedAction);
};

describe("Store with Middleware", () => {
  it("should apply middleware and log actions", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const store = Store.create(
      { test: { reducer: testReducer, initialState: { count: 0 } } },
      [loggerMiddleware]
    );

    store.dispatch({ type: "INCREMENT", payload: 1 });

    expect(consoleSpy).toHaveBeenCalledWith("Dispatching:", {
      type: "INCREMENT",
      payload: 1,
    });
    expect(consoleSpy).toHaveBeenCalledWith("Next state:", {
      test: { count: 1 },
    });

    consoleSpy.mockRestore();
  });

  it("should modify action through middleware", () => {
    const store = Store.create(
      { test: { reducer: testReducer, initialState: { count: 0 } } },
      [modifyActionMiddleware]
    );

    store.dispatch({ type: "UNKNOWN", payload: 1 });
    expect(store.state()).toEqual({ test: { count: 1 } });
  });
});
