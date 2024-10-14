import {
  createAction,
  createActionWithType,
  createActions,
  isActionOf,
} from "../src/actions";
import { Action } from "../src/types";

describe("Action Creators", () => {
  describe("createAction", () => {
    it("should create an action creator function", () => {
      const increment = createAction<number>("counter/increment");
      expect(typeof increment).toBe("function");
    });

    it("should create an action with the correct type and payload", () => {
      const increment = createAction<number>("counter/increment");
      const action = increment(5);
      expect(action).toEqual({ type: "counter/increment", payload: 5 });
    });

    it("should handle actions without payload", () => {
      const reset = createAction("counter/reset");
      const action = reset();
      expect(action).toEqual({ type: "counter/reset", payload: undefined });
    });
  });

  describe("createActionWithType", () => {
    it("should return an object with actionCreator and type", () => {
      const { actionCreator, type } =
        createActionWithType<string>("counter/decrement");
      expect(typeof actionCreator).toBe("function");
      expect(type).toBe("counter/decrement");
    });

    it("should create an action with the correct type and payload", () => {
      const { actionCreator } =
        createActionWithType<number>("counter/decrement");
      const action = actionCreator(3);
      expect(action).toEqual({ type: "counter/decrement", payload: 3 });
    });
  });

  describe("createActions", () => {
    it("should create multiple action creators", () => {
      const todoActions = createActions({
        addTodo: "todo/add",
        removeTodo: "todo/remove",
        toggleTodo: "todo/toggle",
      });

      expect(typeof todoActions.addTodo).toBe("function");
      expect(typeof todoActions.removeTodo).toBe("function");
      expect(typeof todoActions.toggleTodo).toBe("function");
    });

    it("should create actions with correct types and payloads", () => {
      const todoActions = createActions({
        addTodo: "todo/add",
        removeTodo: "todo/remove",
      });

      const addAction = todoActions.addTodo("New Task");
      const removeAction = todoActions.removeTodo(1);

      expect(addAction).toEqual({ type: "todo/add", payload: "New Task" });
      expect(removeAction).toEqual({ type: "todo/remove", payload: 1 });
    });
  });

  describe("isActionOf", () => {
    it("should correctly identify actions created by a specific action creator", () => {
      const increment = createAction<number>("counter/increment");
      const decrement = createAction<number>("counter/decrement");

      const incrementAction: Action<number> = {
        type: "counter/increment",
        payload: 5,
      };
      const decrementAction: Action<number> = {
        type: "counter/decrement",
        payload: 3,
      };

      expect(isActionOf(increment)(incrementAction)).toBe(true);
      expect(isActionOf(increment)(decrementAction)).toBe(false);
      expect(isActionOf(decrement)(decrementAction)).toBe(true);
      expect(isActionOf(decrement)(incrementAction)).toBe(false);
    });

    it("should work with actions created by createActionWithType", () => {
      const { actionCreator: reset } = createActionWithType("counter/reset");
      const resetAction: Action<void> = {
        type: "counter/reset",
        payload: undefined,
      };
      const otherAction: Action<void> = {
        type: "other/action",
        payload: undefined,
      };

      expect(isActionOf(reset)(resetAction)).toBe(true);
      expect(isActionOf(reset)(otherAction)).toBe(false);
    });
  });
});
