export const LITO_DATA_KEY = "__LITO_DATA__";

type ReadSsrDataOptions = {
  dataKey?: string;
  source?: Window;
};

type HydrateCustomElementOptions<Data> = {
  tagName: string;
  property?: string;
  host?: Element | null;
  hostSelector?: string;
  data?: Data;
};

type HydrateFromSsrDataOptions<Data> = {
  tagName: string;
  property?: string;
  host?: Element | null;
  hostSelector?: string;
  dataKey?: string;
  source?: Window;
  select?: (rawData: unknown) => Data | undefined;
};

export function readSsrData<Data = unknown>(options: ReadSsrDataOptions = {}): Data | undefined {
  const source = options.source ?? resolveWindow();

  if (!source) {
    return undefined;
  }

  const key = options.dataKey ?? LITO_DATA_KEY;
  const data = (source as Window & Record<string, unknown>)[key];

  return data as Data | undefined;
}

export function readPageData<PageData = unknown>(options: ReadSsrDataOptions = {}): PageData | undefined {
  const rawData = readSsrData<{ pageData?: PageData } | PageData>(options);

  if (!isObject(rawData)) {
    return rawData as PageData | undefined;
  }

  if ("pageData" in rawData) {
    return (rawData as { pageData?: PageData }).pageData;
  }

  return rawData as PageData;
}

export function hydrateCustomElement<Data>(options: HydrateCustomElementOptions<Data>): HTMLElement | null {
  const documentObject = resolveDocument();

  if (!documentObject) {
    return null;
  }

  const host = options.host ?? documentObject.querySelector(options.hostSelector ?? "#app");

  if (!host) {
    return null;
  }

  const element = documentObject.createElement(options.tagName) as HTMLElement & Record<string, unknown>;
  const property = options.property ?? "data";

  if (options.data !== undefined) {
    element[property] = options.data;
  }

  host.replaceChildren(element);
  return element;
}

export function hydrateFromSsrData<Data>(options: HydrateFromSsrDataOptions<Data>): HTMLElement | null {
  const rawData = readSsrData({
    dataKey: options.dataKey,
    source: options.source
  });
  const data = options.select ? options.select(rawData) : (rawData as Data | undefined);

  return hydrateCustomElement({
    tagName: options.tagName,
    property: options.property,
    host: options.host,
    hostSelector: options.hostSelector,
    data
  });
}

function resolveWindow() {
  return typeof window === "undefined" ? undefined : window;
}

function resolveDocument() {
  return typeof document === "undefined" ? undefined : document;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}