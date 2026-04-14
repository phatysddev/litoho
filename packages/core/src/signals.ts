type SignalListener<T> = (value: T) => void;
type WatchTarget = "client" | "server" | "both";
type WatchOptions = {
  target?: WatchTarget;
};

type Trackable<T> = {
  get: () => T;
  subscribe: (listener: SignalListener<T>) => () => void;
};

type TrackingContext = {
  sources: Set<Trackable<unknown>>;
};

export type Signal<T> = Trackable<T> & {
  value: T;
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
};

export type ReadonlySignal<T> = Trackable<T> & {
  readonly value: T;
};

export type WatchDependency =
  | Trackable<unknown>
  | (() => unknown);

let activeTrackingContext: TrackingContext | null = null;
let batchDepth = 0;
const pendingJobs = new Set<() => void>();
const isClientRuntime = typeof window !== "undefined";
const isServerRuntime = !isClientRuntime;

function withTrackingContext<R>(context: TrackingContext, fn: () => R): R {
  const previousContext = activeTrackingContext;
  activeTrackingContext = context;

  try {
    return fn();
  } finally {
    activeTrackingContext = previousContext;
  }
}

function registerDependency(source: Trackable<unknown>) {
  activeTrackingContext?.sources.add(source);
}

function scheduleJob(job: () => void) {
  if (batchDepth > 0) {
    pendingJobs.add(job);
    return;
  }

  job();
}

function flushPendingJobs() {
  if (pendingJobs.size === 0) {
    return;
  }

  const jobs = [...pendingJobs];
  pendingJobs.clear();

  for (const job of jobs) {
    job();
  }
}

export function track<R>(fn: () => R): {
  result: R;
  signals: Set<Trackable<unknown>>;
} {
  const context: TrackingContext = {
    sources: new Set()
  };

  const result = withTrackingContext(context, fn);

  return {
    result,
    signals: context.sources
  };
}

(globalThis as typeof globalThis & {
  __LITO_TRACK__?: typeof track;
}).__LITO_TRACK__ = track;

export function batch(fn: () => void): void {
  batchDepth += 1;

  try {
    fn();
  } finally {
    batchDepth -= 1;

    if (batchDepth === 0) {
      flushPendingJobs();
    }
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  let currentValue = initialValue;
  const listeners = new Set<SignalListener<T>>();

  const emit = () => {
    const nextValue = currentValue;
    for (const listener of [...listeners]) {
      listener(nextValue);
    }
  };

  return {
    get() {
      registerDependency(this);
      return currentValue;
    },
    get value() {
      return this.get();
    },
    set value(nextValue: T) {
      this.set(nextValue);
    },
    set(value) {
      if (Object.is(currentValue, value)) {
        return;
      }

      currentValue = value;
      scheduleJob(emit);
    },
    update(updater) {
      this.set(updater(currentValue));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export function memo<T>(fn: () => T): ReadonlySignal<T> {
  let cachedValue: T;
  let initialized = false;
  let dirty = true;
  let dependencyDisposers: Array<() => void> = [];
  const listeners = new Set<SignalListener<T>>();

  const markDirty = () => {
    if (dirty) {
      return;
    }

    dirty = true;
    scheduleJob(emit);
  };

  const emit = () => {
    const nextValue = signal.get();
    for (const listener of [...listeners]) {
      listener(nextValue);
    }
  };

  const recompute = () => {
    for (const dispose of dependencyDisposers) {
      dispose();
    }
    dependencyDisposers = [];

    const { result, signals } = track(fn);
    cachedValue = result;
    initialized = true;
    dirty = false;

    for (const dependency of signals) {
      dependencyDisposers.push(dependency.subscribe(markDirty));
    }
  };

  const signal: ReadonlySignal<T> = {
    get() {
      registerDependency(this);

      if (!initialized || dirty) {
        recompute();
      }

      return cachedValue;
    },
    get value() {
      return this.get();
    },
    subscribe(listener) {
      listeners.add(listener);

      if (!initialized) {
        recompute();
      }

      return () => {
        listeners.delete(listener);
      };
    }
  };

  return signal;
}

function isTrackable(value: WatchDependency): value is Trackable<unknown> {
  return typeof value === "object" && value !== null && "subscribe" in value && typeof value.subscribe === "function";
}

function normalizeWatchArgs(
  depsOrOptions?: WatchDependency[] | WatchOptions,
  maybeOptions?: WatchOptions
): {
  dependencies: WatchDependency[] | null;
  options: WatchOptions;
} {
  if (Array.isArray(depsOrOptions)) {
    return {
      dependencies: depsOrOptions,
      options: maybeOptions ?? {}
    };
  }

  return {
    dependencies: null,
    options: depsOrOptions ?? {}
  };
}

export function watch(
  fn: () => void | (() => void),
  depsOrOptions?: WatchDependency[] | WatchOptions,
  maybeOptions: WatchOptions = {}
): () => void {
  const { dependencies, options } = normalizeWatchArgs(depsOrOptions, maybeOptions);
  const target = options.target ?? "both";
  const shouldRun =
    target === "both" || (target === "client" && isClientRuntime) || (target === "server" && isServerRuntime);

  if (!shouldRun) {
    return () => {};
  }

  let stopped = false;
  let cleanup: void | (() => void);
  let dependencyDisposers: Array<() => void> = [];
  let rerunScheduled = false;

  const teardownDependencies = () => {
    for (const dispose of dependencyDisposers) {
      dispose();
    }
    dependencyDisposers = [];
  };

  const scheduleRerun = () => {
    if (rerunScheduled || stopped) {
      return;
    }

    rerunScheduled = true;
    queueMicrotask(() => {
      rerun();
    });
  };

  const subscribeToExplicitDependencies = () => {
    if (!dependencies) {
      return;
    }

    for (const dependency of dependencies) {
      if (isTrackable(dependency)) {
        dependencyDisposers.push(dependency.subscribe(scheduleRerun));
        continue;
      }

      if (typeof dependency === "function") {
        const { signals } = track(dependency);

        for (const signalDependency of signals) {
          dependencyDisposers.push(signalDependency.subscribe(scheduleRerun));
        }
      }
    }
  };

  const rerun = () => {
    if (stopped) {
      return;
    }

    rerunScheduled = false;
    teardownDependencies();

    if (typeof cleanup === "function") {
      cleanup();
    }

    const { result, signals } = dependencies ? { result: fn(), signals: new Set<Trackable<unknown>>() } : track(fn as () => void);
    cleanup = result as void | (() => void);

    for (const dependency of signals) {
      dependencyDisposers.push(dependency.subscribe(scheduleRerun));
    }

    subscribeToExplicitDependencies();
  };

  rerun();

  return () => {
    stopped = true;
    teardownDependencies();

    if (typeof cleanup === "function") {
      cleanup();
      cleanup = undefined;
    }
  };
}
