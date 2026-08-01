/**
 * Minimal type declarations for Cloudflare Pages Functions.
 *
 * This file exists because the project doesn't pull in
 * @cloudflare/workers-types as a dep. Just enough surface to satisfy
 * `next build` TypeScript checking for the handlers in functions/.
 */

declare global {
  interface EventContext<Env = Record<string, unknown>, P extends string = string, Data = Record<string, unknown>> {
    request: Request;
    env: Env;
    params: Record<P, string>;
    data: Data;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    waitUntil: (promise: Promise<unknown>) => void;
    passThroughOnException: () => void;
  }

  type PagesFunction<Env = Record<string, unknown>, P extends string = string, Data = Record<string, unknown>> = (
    context: EventContext<Env, P, Data>
  ) => Response | Promise<Response>;
}

export {};
