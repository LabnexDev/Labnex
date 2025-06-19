export function addLog(logMessage: string): void {
  if (process.env.NODE_ENV === 'development' || process.env.LABNEX_VERBOSE === 'true') {
    console.log(`[TestStepParser] ${logMessage}`);
  }
} 