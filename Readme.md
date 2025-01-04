# ReduceMe

Hey there! 👋 Welcome to ReduceMe, a learning-focused state management library that helps you understand how Redux and reducers really work under the hood. I built this library to demystify state management patterns and share what I learned while studying Redux. Think of it as your friendly guide to understanding how the big players in state management actually tick!


## Why I Built This

Let's be honest - when I first encountered Redux, my brain felt like it was trying to solve a Rubik's cube in the dark. There were reducers, actions, middleware... it was a lot! So I decided to build ReduceMe as a learning tool that breaks down these concepts into digestible pieces. Every part of this library is designed to help you understand:

- How reducers transform state (it's not magic, I promise!)
- Why immutability matters 
- How middleware intercepts and transforms actions 
- Why TypeScript and state management are a match made in heaven

The code is thoroughly commented and structured to be read and understood, not just used. 

## Features

- 🎯 **Type Safety**: Built from the ground up with TypeScript for excellent type inference and compile-time checks
- 🔄 **Immutable Updates**: Powered by Immer for intuitive state updates while maintaining immutability
- 🧩 **Modular Design**: Supports slice-based state management for better code organization
- ⚡ **Middleware Support**: Extensible with middleware for logging, async operations, and more
- 🎨 **Modern API**: Inspired by Redux Toolkit with a focus on developer experience
- 📦 **Lightweight**: Minimal dependencies, only requires Immer

## Installation

```bash
npm install reduceme
```

## Quick Start

Here's a simple counter example:

```typescript
import { createSlice, Store } from 'reduceme';

// Define the state interface
interface CounterState {
  value: number;
}

// Create a slice for counter state
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 } as CounterState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: { payload: number }) => {
      state.value += action.payload;
    },
  },
});

// Create the store
const store = Store.create({
  counter: counterSlice.reducer,
});

// Use the store
store.dispatch(counterSlice.actions.increment());
console.log(store.state()); // { counter: { value: 1 } }

// Subscribe to changes
store.registerListener((state) => {
  console.log('State updated:', state);
});
```

## Core Concepts

### Slices

Slices are portions of your application state with their associated reducers and actions. They help organize your state logic into manageable pieces.

```typescript
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodosState {
  items: TodoItem[];
  loading: boolean;
}

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    loading: false,
  } as TodosState,
  reducers: {
    addTodo: (state, action: { payload: TodoItem }) => {
      state.items.push(action.payload);
    },
    removeTodo: (state, action: { payload: string }) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    toggleTodo: (state, action: { payload: string }) => {
      const todo = state.items.find(item => item.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },
  },
});
```

### Middleware

Middleware provides a way to extend the store's capabilities. Here are some common middleware patterns:

```typescript
// Logger middleware
const loggerMiddleware = (store: Store) => 
  (next: (action: any) => any) => 
  (action: any) => {
    console.log('Before:', store.state());
    const result = next(action);
    console.log('After:', store.state());
    return result;
};

// Async middleware for handling promises
const asyncMiddleware = (store: Store) => 
  (next: (action: any) => any) => 
  (action: any) => {
    if (typeof action.payload?.then === 'function') {
      return action.payload.then((result: any) => {
        return next({ ...action, payload: result });
      });
    }
    return next(action);
};

const store = Store.create(
  { todos: todosSlice.reducer },
  [loggerMiddleware, asyncMiddleware]
);
```

### Error Handling

ReduceMe provides several ways to handle errors in your application:

```typescript
// Error handling in reducers
const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    error: null,
  } as TodosState,
  reducers: {
    addTodoFailure: (state, action: { payload: Error }) => {
      state.error = action.payload.message;
    },
  },
});

// Error handling middleware
const errorMiddleware = (store: Store) => 
  (next: (action: any) => any) => 
  (action: any) => {
    try {
      return next(action);
    } catch (err) {
      console.error('Error in reducer:', err);
      store.dispatch({ type: 'ERROR', payload: err });
      return err;
    }
};
```

### TypeScript Integration

ReduceMe is built with TypeScript and provides excellent type inference:

```typescript
// Define your state structure
interface RootState {
  counter: CounterState;
  todos: TodosState;
}

// Create a typed store
const store = Store.create<RootState>({
  counter: counterSlice.reducer,
  todos: todosSlice.reducer,
});

// Type-safe dispatch and state access
const state = store.state(); // RootState
store.dispatch(todosSlice.actions.addTodo({
  id: '1',
  text: 'Learn ReduceMe',
  completed: false,
}));
```

### Advanced Features

#### Computed Values (Selectors)

```typescript
const selectCompletedTodos = (state: RootState) => 
  state.todos.items.filter(todo => todo.completed);

const selectTodoCount = (state: RootState) => 
  state.todos.items.length;

// Usage
const completedTodos = selectCompletedTodos(store.state());
```

#### Action Creators with Preparation

```typescript
const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] } as TodosState,
  reducers: {
    addTodo: {
      prepare: (text: string) => ({
        payload: {
          id: Date.now().toString(),
          text,
          completed: false,
        },
      }),
      reducer: (state, action: { payload: TodoItem }) => {
        state.items.push(action.payload);
      },
    },
  },
});
```


## License

MIT License - Because learning should be free! Feel free to use this to learn, teach, or build something awesome. Just remember to share what you learn with others! 😉