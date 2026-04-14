export const isClient = typeof window !== "undefined";

export const isServer = !isClient;

export function onClient(fn: () => void): void {
  if (!isClient) {
    return;
  }

  fn();
}

export function onServer(fn: () => void): void {
  if (!isServer) {
    return;
  }

  fn();
}
