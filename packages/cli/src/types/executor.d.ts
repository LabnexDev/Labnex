// Stub typings for @labnex/executor to break circular build dependency during CLI compilation.
declare module '@labnex/executor' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const LocalBrowserExecutor: any;

  // Minimal shape for TestCaseResult – the real interface lives in the executor package.
  export interface TestCaseResult {
    [key: string]: any;
  }

  // Catch-all default export so `require("@labnex/executor")` still works at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fallback: any;
  export default fallback;
} 