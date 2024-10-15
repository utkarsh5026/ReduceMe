import { Action, CreateAction } from "./types";

/**
 * Creates an action creator function.
 *
 * @param type The action type
 * @returns An action creator function
 */
export function createAction<P = void>(type: string): CreateAction<P> {
  return ((payload?: P) =>
    ({ type, payload } as Action<P>)) as CreateAction<P>;
}

/**
 * Creates an action creator and returns it along with its type.
 *
 * @param type The action type
 * @returns An object containing the action creator and its type
 */
export function createActionWithType<P = void>(
  type: string
): { actionCreator: CreateAction<P>; type: string } {
  return {
    actionCreator: createAction<P>(type),
    type,
  };
}

/**
 * A utility function to create multiple actions at once.
 *
 * @param actionTypes An object where keys are action names and values are action types
 * @returns An object with action creators
 */
export function createActions<T extends Record<string, string>>(
  actionTypes: T
): { [K in keyof T]: CreateAction<any> } {
  const actionCreators: { [K in keyof T]: CreateAction<any> } = {} as any;

  Object.entries(actionTypes).forEach(([key, type]) => {
    actionCreators[key as keyof T] = createAction(type);
  });

  return actionCreators;
}

/**
 * Creates a type guard function for actions created by a specific action creator.
 *
 * @template P The payload type of the action
 * @param actionCreator The action creator function to check against
 * @returns A function that checks if an action was created by the given action creator
 *
 * @example
 * const increment = createAction<number>('INCREMENT');
 * const isIncrementAction = isActionOf(increment);
 *
 * if (isIncrementAction(someAction)) {
 *   // someAction is guaranteed to be an INCREMENT action with a number payload
 *   console.log(someAction.payload);
 * }
 */
export function isActionOf<P = any>(
  actionCreator: CreateAction<P>
): (action: Action<any>) => action is Action<P> {
  return (action: Action<any>): action is Action<P> =>
    action.type === (actionCreator({} as P) as Action<P>).type;
}