// Re-export from the *built* CLI bundle rather than its source file.  
// This keeps all referenced files inside node-module resolution boundaries and
// avoids TypeScript complaining that the CLI source file is outside the
// executor package's `rootDir`/`include` set.
export { TestStepParser } from '@labnex/cli/dist/testStepParser'; 