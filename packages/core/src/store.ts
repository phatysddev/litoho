import { memo, signal, type ReadonlySignal } from "./signals.js";

export type StoreState<S> = S extends Store<infer T> ? T : never;

export type Store<T extends Record<string, unknown>> = {
  get(): Readonly<T>;
  get<K extends keyof T>(key: K): T[K];
  set(partial: Partial<T>): void;
  set<K extends keyof T>(key: K, value: T[K]): void;
  subscribe(listener: (state: Readonly<T>) => void): () => void;
  subscribe<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
};

export function store<T extends Record<string, unknown>>(initialState: T): Store<T> {
  const stateSignal = signal({ ...initialState });
  const fieldSignals = new Map<keyof T, ReadonlySignal<T[keyof T]>>();

  function getFieldSignal<K extends keyof T>(key: K): ReadonlySignal<T[K]> {
    if (!fieldSignals.has(key)) {
      fieldSignals.set(
        key,
        memo(() => {
          return stateSignal.get()[key];
        }) as ReadonlySignal<T[keyof T]>
      );
    }

    return fieldSignals.get(key) as ReadonlySignal<T[K]>;
  }

  const getState = () => {
    return Object.freeze({ ...stateSignal.get() });
  };

  function get<K extends keyof T>(key: K): T[K];
  function get(): Readonly<T>;
  function get(...args: unknown[]) {
      if (args.length === 0) {
        return getState();
      }

      const key = args[0] as keyof T;
      return getFieldSignal(key).get();
  }

  function set<K extends keyof T>(key: K, value: T[K]): void;
  function set(partial: Partial<T>): void;
  function set(...args: unknown[]) {
      if (args.length === 2) {
        const key = args[0] as keyof T;
        const value = args[1] as T[keyof T];
        const currentState = stateSignal.get();

        if (Object.is(currentState[key], value)) {
          return;
        }

        stateSignal.set({
          ...currentState,
          [key]: value
        } as T);
        return;
      }

      const partial = args[0] as Partial<T>;
      const currentState = stateSignal.get();
      const nextState = {
        ...currentState,
        ...partial
      } as T;

      let changed = false;

      for (const key of Object.keys(partial) as Array<keyof T>) {
        if (!Object.is(currentState[key], nextState[key])) {
          changed = true;
          break;
        }
      }

      if (!changed) {
        return;
      }

      stateSignal.set(nextState);
  }

  function subscribe(listener: (state: Readonly<T>) => void): () => void;
  function subscribe<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
  function subscribe(...args: unknown[]) {
      if (args.length === 2) {
        const key = args[0] as keyof T;
        const listener = args[1] as (value: T[keyof T]) => void;
        return getFieldSignal(key).subscribe(listener as (value: T[keyof T]) => void);
      }

      const listener = args[0] as (state: Readonly<T>) => void;

      return stateSignal.subscribe((state) => {
        listener(Object.freeze({ ...state }));
      });
  }

  const store: Store<T> = {
    get,
    set,
    subscribe
  };

  return store;
}
