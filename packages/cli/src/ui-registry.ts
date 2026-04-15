export const UI_COMPONENT_REGISTRY = {
  badge: {
    module: "badge",
    dependencies: [] as const,
    title: "Badge",
    description: "Small status pill for labels, states, and tags.",
    tags: ["status", "label", "pill"],
    snippet: `<lui-badge variant="outline">Beta</lui-badge>`
  },
  button: {
    module: "button",
    dependencies: [] as const,
    title: "Button",
    description: "Primary action primitive with multiple variants and sizes.",
    tags: ["action", "cta", "trigger"],
    snippet: `<lui-button variant="default">Save changes</lui-button>`
  },
  card: {
    module: "card",
    dependencies: [] as const,
    title: "Card",
    description: "Structured surface with header, content, and footer slots.",
    tags: ["surface", "panel", "layout"],
    snippet: `<lui-card><lui-card-content>Content</lui-card-content></lui-card>`
  },
  dialog: {
    module: "dialog",
    dependencies: [] as const,
    title: "Dialog",
    description: "Overlay primitive for confirmations, forms, and focused flows.",
    tags: ["overlay", "modal", "focus"],
    snippet: `<lui-dialog><lui-dialog-trigger>Open</lui-dialog-trigger></lui-dialog>`
  },
  dropdown: {
    module: "dropdown",
    dependencies: [] as const,
    title: "Dropdown Menu",
    description: "Compact action menu for contextual commands.",
    tags: ["menu", "actions", "overlay"],
    snippet: `<lui-dropdown-menu><lui-dropdown-trigger>Open</lui-dropdown-trigger></lui-dropdown-menu>`
  },
  input: {
    module: "input",
    dependencies: [] as const,
    title: "Input",
    description: "Text input field for common form interactions.",
    tags: ["form", "field", "text"],
    snippet: `<lui-input placeholder="Project name"></lui-input>`
  },
  textarea: {
    module: "input",
    dependencies: [] as const,
    title: "Textarea",
    description: "Multi-line text field sharing the input module.",
    tags: ["form", "field", "multiline"],
    snippet: `<lui-textarea placeholder="Details"></lui-textarea>`
  },
  select: {
    module: "select",
    dependencies: [] as const,
    title: "Select",
    description: "Custom select primitive for single-choice input.",
    tags: ["form", "choice", "picker"],
    snippet: `<lui-select><lui-select-option value="a">Option</lui-select-option></lui-select>`
  },
  tabs: {
    module: "tabs",
    dependencies: [] as const,
    title: "Tabs",
    description: "Segmented content view with trigger and content primitives.",
    tags: ["navigation", "segmented", "switcher"],
    snippet: `<lui-tabs><lui-tabs-list><lui-tabs-trigger value="a">A</lui-tabs-trigger></lui-tabs-list></lui-tabs>`
  },
  toast: {
    module: "toast",
    dependencies: [] as const,
    title: "Toast",
    description: "Ephemeral feedback UI driven by an imperative helper.",
    tags: ["feedback", "notification", "overlay"],
    snippet: `<lui-toast-region></lui-toast-region>`
  }
} as const;

export const UI_PRESET_REGISTRY = {
  form: {
    title: "Form Essentials",
    description: "Common primitives for forms and data entry flows.",
    components: ["input", "textarea", "select", "button"] as const
  },
  overlay: {
    title: "Overlay Kit",
    description: "Overlay and transient feedback primitives.",
    components: ["dialog", "dropdown", "toast", "button"] as const
  },
  content: {
    title: "Content Layout",
    description: "Primitives for section layout and structured content.",
    components: ["card", "badge", "button"] as const
  },
  navigation: {
    title: "Navigation Set",
    description: "Segmented and contextual navigation building blocks.",
    components: ["tabs", "dropdown", "button"] as const
  }
} as const;

export type UiComponentRegistryKey = keyof typeof UI_COMPONENT_REGISTRY;
export type UiPresetRegistryKey = keyof typeof UI_PRESET_REGISTRY;

export function isUiComponentName(value: string): value is UiComponentRegistryKey {
  return value in UI_COMPONENT_REGISTRY;
}

export function isUiPresetName(value: string): value is UiPresetRegistryKey {
  return value in UI_PRESET_REGISTRY;
}

export function expandUiSelection(items: string[]) {
  const components = new Set<UiComponentRegistryKey>();
  const requestedComponents = new Set<UiComponentRegistryKey>();
  const presets: UiPresetRegistryKey[] = [];

  const addComponent = (component: UiComponentRegistryKey) => {
    if (components.has(component)) {
      return;
    }

    components.add(component);

    for (const dependency of UI_COMPONENT_REGISTRY[component].dependencies) {
      addComponent(dependency);
    }
  };

  for (const item of items) {
    const normalized = item.trim().toLowerCase();

    if (isUiPresetName(normalized)) {
      presets.push(normalized);
      for (const component of UI_PRESET_REGISTRY[normalized].components) {
        requestedComponents.add(component);
        addComponent(component);
      }
      continue;
    }

    if (isUiComponentName(normalized)) {
      requestedComponents.add(normalized);
      addComponent(normalized);
      continue;
    }

    throw new Error(
      `Unknown UI component or preset: ${item}. Components: ${Object.keys(UI_COMPONENT_REGISTRY).join(", ")}. Presets: ${Object.keys(UI_PRESET_REGISTRY).join(", ")}`
    );
  }

  return {
    components: [...components],
    requestedComponents: [...requestedComponents],
    presets
  };
}
