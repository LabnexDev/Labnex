// Stub type declarations for the built CLI bundle that the executor re-exports.
// This avoids TS7016 during the executor build when the CLI's declaration
// files are not emitted (declaration=false).

declare module '@labnex/cli/dist/testStepParser' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class TestStepParser {
    // Static method used by executor code
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseStep(step: any): any;

    // Instance method (not currently used)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parseSteps(steps: any): any;
  }
} 