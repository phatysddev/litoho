import test from "node:test";
import assert from "node:assert/strict";
import { batch, memo, signal, watch } from "../../core/dist/signals.js";
import { store } from "../../core/dist/store.js";

function flushMicrotasks() {
  return new Promise((resolve) => queueMicrotask(resolve));
}

test("signal updates subscribers and memo values", async () => {
  const count = signal(1);
  const doubled = memo(() => count.get() * 2);
  const observed = [];

  const unsubscribe = doubled.subscribe((value) => {
    observed.push(value);
  });

  assert.equal(doubled.get(), 2);

  count.set(2);
  await flushMicrotasks();

  assert.equal(doubled.get(), 4);
  assert.deepEqual(observed, [4]);

  unsubscribe();
});

test("signal and memo expose .value shorthand", () => {
  const count = signal(2);
  const doubled = memo(() => count.value * 2);

  assert.equal(count.value, 2);
  assert.equal(doubled.value, 4);

  count.value = 5;

  assert.equal(count.value, 5);
  assert.equal(doubled.value, 10);
});

test("batch coalesces signal notifications", async () => {
  const count = signal(0);
  const observed = [];

  count.subscribe((value) => {
    observed.push(value);
  });

  batch(() => {
    count.set(1);
    count.set(2);
    count.set(3);
  });
  await flushMicrotasks();

  assert.deepEqual(observed, [3]);
  assert.equal(count.get(), 3);
});

test("watch reruns when dependencies change", async () => {
  const first = signal("Lito");
  const second = signal("Framework");
  const seen = [];

  const stop = watch(() => {
    seen.push(`${first.get()} ${second.get()}`);
  });

  second.set("State");
  first.set("New");
  await flushMicrotasks();

  stop();
  second.set("Ignored");
  await flushMicrotasks();

  assert.deepEqual(seen, ["Lito Framework", "New State"]);
});

test("watch accepts explicit dependency arrays", async () => {
  const count = signal(1);
  const doubled = memo(() => count.value * 2);
  const ignored = signal("idle");
  const seen = [];

  const stop = watch(() => {
    seen.push(`${count.value}:${doubled.value}`);
  }, [count, doubled]);

  ignored.value = "busy";
  await flushMicrotasks();

  count.value = 4;
  await flushMicrotasks();

  stop();

  assert.deepEqual(seen, ["1:2", "4:8"]);
});

test("store supports whole-state and field subscriptions", async () => {
  const profile = store({
    name: "Lito",
    count: 1
  });

  const states = [];
  const counts = [];

  const unsubscribeState = profile.subscribe((state) => {
    states.push(state);
  });
  const unsubscribeCount = profile.subscribe("count", (count) => {
    counts.push(count);
  });

  profile.set("count", 2);
  profile.set({
    name: "Framework",
    count: 3
  });
  await flushMicrotasks();

  unsubscribeState();
  unsubscribeCount();

  assert.deepEqual(states, [
    { name: "Lito", count: 2 },
    { name: "Framework", count: 3 }
  ]);
  assert.deepEqual(counts, [2, 3]);
  assert.equal(profile.get("name"), "Framework");
});
