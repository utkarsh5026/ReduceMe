# Middleware in Our Redux-like Library

## 1. Introduction to Middleware

Middleware is a powerful feature in Redux-like state management systems. It provides a third-party extension point between dispatching an action and the moment it reaches the reducer. Middleware can be used for logging, crash reporting, talking to an asynchronous API, routing, and much more.

## 2. Middleware Concept

In essence, middleware wraps the store's dispatch method. It allows you to intercept every action sent to the store, execute some code, and pass the action along to the next middleware or to the reducer. This enables powerful customizations and enhancements to the basic Redux data flow.

## 3. Middleware Implementation in Our Library

### 3.1 Middleware Type Definition

In our library, middleware is defined as follows:

```typescript
type Middleware<State = any> = (
  store: MiddlewareAPI<State>
) => (next: Dispatch) => (action: Action<any>) => void;
```

Let's break this down:

- It's a function that takes a `MiddlewareAPI` object.
- It returns a function that takes a `next` dispatch function.
- This function returns another function that takes an `action`.
- The final function doesn't return anything (`void`), as it's expected to call `next(action)` or `dispatch(action)` to pass the action along.

### 3.2 MiddlewareAPI Interface

The `MiddlewareAPI` provides middleware with access to the store's `state` and `dispatch` methods:

```typescript
interface MiddlewareAPI<State> {
  state(): State;
  dispatch(action: Action<any>): void;
}
```

This allows middleware to:

- Read the current state
- Dispatch new actions

### 3.3 Dispatch Type

The `Dispatch` type represents the basic dispatch function:

```typescript
type Dispatch = (action: Action<any>) => void;
```

## 4. Middleware Application in the Store

Middleware is applied in the `Store` class constructor:

```typescript
private constructor(
  reducer: Reducer<State>,
  initialState: State,
  middlewares: Middleware<State>[] = []
) {
  // ...
  if (middlewares.length > 0)
    this._dispatch = this._applyMiddleware(middlewares);
}
```

If middlewares are provided, the `_applyMiddleware` method is called to enhance the store's dispatch function.

### 4.1 The _applyMiddleware Method

This method is responsible for composing multiple middleware functions into a single function:

```typescript
private _applyMiddleware(middlewares: Middleware<State>[]): Dispatch {
  const store: MiddlewareAPI<State> = {
    state: this.state.bind(this),
    dispatch: (action: Action) => this._dispatch(action),
  };

  const chain = middlewares.map((middleware) => middleware(store));
  const pipe = this._compose(...chain);
  return pipe(this._baseDispatch.bind(this));
}
```

Here's what's happening:

1. We create a `store` object that conforms to the `MiddlewareAPI` interface.
2. We create a `chain` of middleware by calling each middleware with the `store` object.
3. We `_compose` this chain of middleware into a single function.
4. We apply this composed function to our base dispatch method.

### 4.2 The _compose Method

This helper method composes multiple functions into a single function:

```typescript
private _compose(...funcs: Function[]): Function {
  if (funcs.length === 0) return (arg: any) => arg;
  if (funcs.length === 1) return funcs[0];
  return funcs.reduce(
    (a, b) =>
      (...args: any[]) =>
        a(b(...args))
  );
}
```

This allows us to turn `[f, g, h]` into `f(g(h()))`.

## 5. How Middleware Works in Our Implementation

When an action is dispatched:

1. It first goes through all the middleware in the order they were provided.
2. Each middleware can:
   - Pass the action to the next middleware or reducer (`next(action)`).
   - Dispatch a new action (`dispatch(action)`).
   - Do something else (like logging) and not pass the action along.
3. If all middleware pass the action along, it eventually reaches the reducer.

## 6. Creating Middleware

To create middleware, you need to define a function that conforms to the `Middleware` type. Here's a template:

```typescript
const exampleMiddleware: Middleware = (store) => (next) => (action) => {
  // Your middleware logic here
  // You can:
  // - Inspect the action: console.log(action)
  // - Modify the action: action.payload = transformedPayload
  // - Dispatch new actions: store.dispatch(newAction)
  // - Stop the action: return without calling next(action)
  // - Pass it along: next(action)
};
```

## 7. Example Middlewares

### 7.1 Logging Middleware

```typescript
const loggingMiddleware: Middleware = (store) => (next) => (action) => {
  console.log('Before action:', action.type, store.state());
  const result = next(action);
  console.log('After action:', action.type, store.state());
  return result;
};
```

This middleware logs the state before and after each action is processed.

### 7.2 Thunk Middleware

```typescript
const thunkMiddleware: Middleware = (store) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.state);
  }
  return next(action);
};
```

This middleware allows you to dispatch functions, which can be used for asynchronous actions.

## 8. Using Middleware

Middleware is applied when creating a store:

```typescript
const store = Store.create(
  rootReducer,
  [loggingMiddleware, thunkMiddleware]
);
```

The order of middleware in the array matters: actions will flow through them in the order specified.

## 9. Benefits of Our Middleware Implementation

1. **Flexibility**: Developers can easily add custom behaviors to action processing.
2. **Separation of Concerns**: Complex logic (like async operations) can be moved out of reducers and into middleware.
3. **Reusability**: Middleware can be shared between different projects.
4. **Composability**: Multiple middleware can be combined easily.
5. **Access to Store**: Middleware has access to `dispatch` and `state`, allowing for powerful capabilities.

## 10. Considerations When Using Middleware

1. **Order Matters**: The order of middleware in the array determines the order they process actions.
2. **Performance**: Be mindful of performance implications when adding multiple middleware.
3. **Side Effects**: While middleware can perform side effects, it's important to use this capability judiciously to maintain predictability.

# Triple Functions in Middleware: Detailed Explanation

## 1. Introduction

In our Redux-like library, middleware is implemented using a pattern known as "triple functions" or "currying". This document will explain what triple functions are, why we use them, and how they fit into our middleware implementation.

## 2. What are Triple Functions?

In our middleware implementation, a triple function is a function that returns a function that returns a function. It looks like this:

```typescript
type Middleware<State = any> = (
  store: MiddlewareAPI<State>
) => (next: Dispatch) => (action: Action<any>) => void;
```

This can be broken down into three layers:

1. `(store: MiddlewareAPI<State>) => ...`
2. `(next: Dispatch) => ...`
3. `(action: Action<any>) => void`

## 3. The Intuition Behind Triple Functions

To understand why we use this pattern, let's break it down step by step:

### 3.1 First Function: Setup

```typescript
(store: MiddlewareAPI<State>) => ...
```

This outer function is called when the middleware is initially applied to the store. It receives the `store` object, which provides access to `dispatch` and `getState` methods. This allows the middleware to interact with the store if needed.

Intuition: This is the "setup" phase. It's where you can configure your middleware based on the store.

### 3.2 Second Function: Chain Formation

```typescript
(next: Dispatch) => ...
```

This middle function receives the `next` dispatch function. In the middleware chain, `next` refers to either the next middleware in line or the store's base dispatch function if it's the last middleware.

Intuition: This is the "linking" phase. It's how each middleware is connected to the next one in the chain.

### 3.3 Third Function: Action Handling

```typescript
(action: Action<any>) => void
```

This innermost function is what will be called every time an action is dispatched. It receives the `action` object and can decide what to do with it.

Intuition: This is the "execution" phase. It's where the actual logic of your middleware runs for each action.

## 4. Why Use Triple Functions?

The triple function pattern provides several benefits:

1. **Separation of Concerns**: Each function has a clear, separate responsibility.
2. **Flexibility**: Middleware can be easily composed and reordered.
3. **Access to Store and Next**: Middleware has access to both the store and the next dispatch function, allowing for powerful capabilities.
4. **Closure Over Store and Next**: The inner functions have closure over `store` and `next`, allowing them to be used in the action handling logic without being passed as parameters each time.
5. **Lazy Evaluation**: The actual action handling function isn't created until all middleware is linked together, allowing for optimizations.

## 5. How Triple Functions Fit into Our Middleware Implementation

In our `Store` class, we apply middleware using the `_applyMiddleware` method:

```typescript
private _applyMiddleware(middlewares: Middleware<State>[]): Dispatch {
  const store: MiddlewareAPI<State> = {
    state: this.state.bind(this),
    dispatch: (action: Action) => this._dispatch(action),
  };

  const chain = middlewares.map((middleware) => middleware(store));
  const pipe = this._compose(...chain);
  return pipe(this._baseDispatch.bind(this));
}
```

Here's how the triple functions are used:

1. We call each middleware with the `store` object, which executes the outer function and returns the middle function.
2. We compose these middle functions together using `_compose`, creating a single function that represents the entire middleware chain.
3. We call this composed function with `_baseDispatch`, which executes all the middle functions and returns the innermost function.
4. The resulting function is a new `dispatch` function that includes all the middleware logic.

## 6. Example: Logger Middleware

Let's look at how a logger middleware would be implemented using this pattern:

```typescript
const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  console.log('Will dispatch:', action);
  
  const result = next(action);
  
  console.log('State after dispatch:', store.state());
  
  return result;
};
```

- The outer function receives `store` and sets up the middleware.
- The middle function receives `next`, allowing the middleware to be chained.
- The inner function receives each `action`, logs it, calls `next(action)` to pass it along, then logs the resulting state.

## 7. Conclusion

The triple function pattern in our middleware implementation provides a powerful and flexible way to extend the behavior of our Redux-like library. It allows middleware to be easily composed, provides access to necessary context (store and next dispatch), and separates the concerns of setup, chaining, and execution.

This pattern, while initially complex, enables the creation of sophisticated middleware that can intercept actions, perform async operations, modify the action stream, and much more, all while maintaining a clean and predictable structure.




# Middleware Composition: Simple Examples and Detailed Explanation

## 1. Simple Middleware Examples

Let's start with some simple middleware examples to illustrate the concept:

### 1.1 Logging Middleware

```typescript
const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next State:', store.state());
  return result;
};
```

This middleware logs the action before it's processed and the state after it's processed.

### 1.2 Timing Middleware

```typescript
const timingMiddleware: Middleware = (store) => (next) => (action) => {
  const start = Date.now();
  const result = next(action);
  const end = Date.now();
  console.log(`Action ${action.type} took ${end - start}ms`);
  return result;
};
```

This middleware measures how long it takes to process each action.

### 1.3 Error Handling Middleware

```typescript
const errorMiddleware: Middleware = (store) => (next) => (action) => {
  try {
    return next(action);
  } catch (err) {
    console.error('Error in middleware:', err);
    throw err;
  }
};
```

This middleware catches any errors that occur when processing an action.

## 2. The Compose Method

The `compose` method is crucial for combining multiple middleware functions into a single function. Let's look at its implementation and then break down how it works:

```typescript
private _compose(...funcs: Function[]): Function {
  if (funcs.length === 0) return (arg: any) => arg;
  if (funcs.length === 1) return funcs[0];
  return funcs.reduce(
    (a, b) =>
      (...args: any[]) =>
        a(b(...args))
  );
}
```

### 2.1 How Compose Works

1. If no functions are provided, it returns an identity function that just returns its argument.
2. If only one function is provided, it returns that function.
3. If multiple functions are provided, it uses `reduce` to combine them.

Let's break down the reduce operation:

```typescript
(a, b) => (...args: any[]) => a(b(...args))
```

This creates a new function that:

- Takes any number of arguments (`...args`)
- Calls function `b` with these arguments
- Passes the result of `b` to function `a`

### 2.2 Compose Example

Let's say we have three middleware functions: `f`, `g`, and `h`. Here's how compose would work:

```typescript
const composedFunction = compose(f, g, h);
```

This is equivalent to:

```typescript
const composedFunction = (...args) => f(g(h(...args)));
```

When an action is dispatched, it will flow through the middleware in the order: `h` -> `g` -> `f`.

## 3. Applying Compose to Middleware

In the context of our middleware implementation, here's how `compose` is used:

```typescript
private _applyMiddleware(middlewares: Middleware<State>[]): Dispatch {
  const store: MiddlewareAPI<State> = {
    state: this.state.bind(this),
    dispatch: (action: Action) => this._dispatch(action),
  };

  const chain = middlewares.map((middleware) => middleware(store));
  const pipe = this._compose(...chain);
  return pipe(this._baseDispatch.bind(this));
}
```

Let's break this down:

1. Each middleware is called with the `store` object, returning the middle function:

   ```typescript
   const chain = middlewares.map((middleware) => middleware(store));
   ```
2. These middle functions are composed:

   ```typescript
   const pipe = this._compose(...chain);
   ```
3. The composed function is called with `_baseDispatch`:

   ```typescript
   return pipe(this._baseDispatch.bind(this));
   ```

### 3.1 Example with Our Simple Middleware

Let's say we apply our simple middleware like this:

```typescript
const store = Store.create(
  rootReducer,
  [errorMiddleware, timingMiddleware, loggerMiddleware]
);
```

Here's what happens when an action is dispatched:

1. The action first goes through `loggerMiddleware`
2. Then it goes through `timingMiddleware`
3. Then it goes through `errorMiddleware`
4. Finally, it reaches the base dispatch function

The composed dispatch function would look something like this:

```typescript
const composedDispatch = (action) => 
  errorMiddleware(store)(
    timingMiddleware(store)(
      loggerMiddleware(store)(
        store._baseDispatch
      )
    )
  )(action);
```

When an action is dispatched:

1. `loggerMiddleware` logs the action
2. `timingMiddleware` starts its timer
3. `errorMiddleware` sets up its try/catch block
4. The action reaches the base dispatch and the reducers
5. `errorMiddleware` catches any errors
6. `timingMiddleware` calculates and logs the duration
7. `loggerMiddleware` logs the new state

This composition allows each middleware to wrap the next one, providing a powerful way to extend and customize the dispatch process.
