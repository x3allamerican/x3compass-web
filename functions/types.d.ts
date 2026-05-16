declare global {
  interface EventContext<E = unknown, P extends string = string, D = unknown> {
    request: Request;
    env: E;
    params: Record<P, string | string[]>;
    waitUntil: (promise: Promise<unknown>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: D;
  }
  type PagesFunction<E = unknown, P extends string = string, D = unknown> =
    (context: EventContext<E, P, D>) => Response | Promise<Response>;
}
export {};
