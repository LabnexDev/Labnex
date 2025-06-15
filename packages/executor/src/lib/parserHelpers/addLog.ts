export function addLog(message: string, data?: any) {
  const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
  if (process.env.LABNEX_VERBOSE === 'true') { 
      console.log(`[TestStepParser] ${logMessage}`);
  }
} 