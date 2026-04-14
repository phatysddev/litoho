type EventMap = GlobalEventHandlersEventMap;

export type DelegatedEventHandler<K extends keyof EventMap> = (
  event: EventMap[K],
  matchedElement: Element
) => void;

export type DelegatedEventConfig = {
  [K in keyof EventMap]?: Record<string, DelegatedEventHandler<K>>;
};

export function delegateEvents(root: Element, config: DelegatedEventConfig): () => void {
  const disposers: Array<() => void> = [];

  for (const [eventName, selectors] of Object.entries(config) as Array<
    [keyof EventMap, Record<string, DelegatedEventHandler<keyof EventMap>>]
  >) {
    const listener = (event: Event) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) {
        return;
      }

      for (const [selector, handler] of Object.entries(selectors)) {
        const matchedElement = eventTarget.closest(selector);
        if (!matchedElement || !root.contains(matchedElement)) {
          continue;
        }

        handler(event as EventMap[typeof eventName], matchedElement);
        return;
      }
    };

    root.addEventListener(eventName, listener as EventListener);
    disposers.push(() => {
      root.removeEventListener(eventName, listener as EventListener);
    });
  }

  return () => {
    for (const dispose of disposers) {
      dispose();
    }
  };
}
