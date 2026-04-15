export function defineElement(name: string, definition: CustomElementConstructor) {
  if (typeof customElements === "undefined") {
    return;
  }

  if (!customElements.get(name)) {
    customElements.define(name, definition);
  }
}
