"use client";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { memo, signal } from "@lito/core";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const todos = signal<Todo[]>([
  { id: 1, text: "Scaffold app with lito", done: true },
  { id: 2, text: "Mark page as client-only", done: true },
  { id: 3, text: "Wire browser events directly", done: false }
]);
const filter = signal<"all" | "active" | "done">("all");
const inputValue = signal("");

let nextId = 4;

const visibleTodos = memo(() => {
  const currentFilter = filter.value;
  const currentTodos = todos.value;

  if (currentFilter === "active") return currentTodos.filter((item) => !item.done);
  if (currentFilter === "done") return currentTodos.filter((item) => item.done);
  return currentTodos;
});

const totals = memo(() => {
  const currentTodos = todos.value;
  const done = currentTodos.filter((item) => item.done).length;
  return {
    total: currentTodos.length,
    done,
    active: currentTodos.length - done
  };
});

const page: LitoPageModule = {
  document: {
    title: "Todos | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; }"]
  },
  render: () => {
    const items = visibleTodos.value;
    const stats = totals.value;
    const activeFilter = filter.value;

    return html`
      <section style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
        <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16);">
          <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">Client app</div>
          <h2 style="margin: 12px 0 8px; font-size: 2.2rem;">Mini todo flow inside Lito</h2>
          <div style="display: flex; gap: 10px; margin-top: 22px;">
            <input
              .value=${inputValue.value}
              @input=${(event: InputEvent) => {
                inputValue.value = (event.target as HTMLInputElement).value;
              }}
              @keydown=${(event: KeyboardEvent) => {
                if (event.key === "Enter") {
                  commitTodo();
                }
              }}
              placeholder="Add framework task"
              style="flex: 1; min-width: 0; padding: 12px 16px; border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.22); background: rgba(2, 6, 23, 0.76); color: #e5eefb; font: inherit;"
            />
            <button @click=${() => commitTodo()} style=${pillButton("#0ea5e9", "#082f49")}>Add</button>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
            ${renderFilterButton("all", `All ${stats.total}`, activeFilter)}
            ${renderFilterButton("active", `Active ${stats.active}`, activeFilter)}
            ${renderFilterButton("done", `Done ${stats.done}`, activeFilter)}
          </div>

          <div style="display: grid; gap: 10px; margin-top: 20px;">
            ${items.map(
              (todo) => html`
                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 14px 16px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                  <button
                    @click=${() => toggleTodo(todo.id)}
                    style=${pillButton(todo.done ? "#f59e0b" : "#0f172a", todo.done ? "#451a03" : "#dbe7f5")}
                  >
                    ${todo.done ? "Done" : "Open"}
                  </button>
                  <div style=${todo.done ? "color: #94a3b8; text-decoration: line-through;" : "color: #e5eefb;"}>${todo.text}</div>
                  <button
                    @click=${() => removeTodo(todo.id)}
                    style=${pillButton("transparent", "#fecaca", "1px solid rgba(248, 113, 113, 0.55)")}
                  >
                    Delete
                  </button>
                </div>
              `
            )}
          </div>

          ${stats.done > 0
            ? html`
                <div style="margin-top: 18px;">
                  <button
                    @click=${() => {
                      todos.value = todos.value.filter((item) => !item.done);
                    }}
                    style=${pillButton("#0f172a", "#dbe7f5")}
                  >
                    Clear done
                  </button>
                </div>
              `
            : null}
        </div>
      </section>
    `;
  }
};

export default page;

function commitTodo() {
  const nextText = inputValue.value.trim();
  if (!nextText) {
    return;
  }

  todos.value = [...todos.value, { id: nextId++, text: nextText, done: false }];
  inputValue.value = "";
}

function toggleTodo(id: number) {
  todos.value = todos.value.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
}

function removeTodo(id: number) {
  todos.value = todos.value.filter((item) => item.id !== id);
}

function renderFilterButton(value: "all" | "active" | "done", label: string, activeFilter: "all" | "active" | "done") {
  return html`
    <button
      @click=${() => {
        filter.value = value;
      }}
      style=${pillButton(activeFilter === value ? "#f59e0b" : "#0f172a", activeFilter === value ? "#451a03" : "#dbe7f5")}
    >
      ${label}
    </button>
  `;
}

function pillButton(background: string, color: string, border = "1px solid rgba(148, 163, 184, 0.2)") {
  return [
    `background: ${background}`,
    `color: ${color}`,
    `border: ${border}`,
    "padding: 10px 14px",
    "border-radius: 999px",
    "font: inherit",
    "cursor: pointer"
  ].join("; ");
}
