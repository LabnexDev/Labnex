enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: any;
}

class BotLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 log entries
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(component: string, message: string, metadata?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${component}] ${message}${metaStr}`;
  }

  private addLog(level: LogLevel, component: string, message: string, metadata?: any): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      metadata
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  public error(component: string, message: string, metadata?: any): void {
    this.addLog(LogLevel.ERROR, component, message, metadata);
    
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(component, message, metadata));
    }
  }

  public warn(component: string, message: string, metadata?: any): void {
    this.addLog(LogLevel.WARN, component, message, metadata);
    
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(component, message, metadata));
    }
  }

  public info(component: string, message: string, metadata?: any): void {
    this.addLog(LogLevel.INFO, component, message, metadata);
    
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(component, message, metadata));
    }
  }

  public debug(component: string, message: string, metadata?: any): void {
    this.addLog(LogLevel.DEBUG, component, message, metadata);
    
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(component, message, metadata));
    }
  }

  public trace(component: string, message: string, metadata?: any): void {
    this.addLog(LogLevel.TRACE, component, message, metadata);
    
    if (this.shouldLog(LogLevel.TRACE)) {
      console.log(this.formatMessage(component, message, metadata));
    }
  }

  // Helper methods for common logging patterns
  public commandStart(command: string, userId: string, params?: any): void {
    this.info('Commands', `Started: ${command}`, { userId, params });
  }

  public commandEnd(command: string, userId: string, success: boolean, duration?: number): void {
    this.info('Commands', `Finished: ${command}`, { userId, success, duration });
  }

  public apiCall(method: string, url: string, status?: number, duration?: number): void {
    const level = status && status >= 400 ? LogLevel.WARN : LogLevel.DEBUG;
    this.addLog(level, 'API', `${method} ${url}`, { status, duration });
    
    if (this.shouldLog(level)) {
      const statusText = status ? ` [${status}]` : '';
      const durationText = duration ? ` (${duration}ms)` : '';
      const message = `${method} ${url}${statusText}${durationText}`;
      
      if (level === LogLevel.WARN) {
        console.warn(this.formatMessage('API', message));
      } else {
        console.log(this.formatMessage('API', message));
      }
    }
  }

  public userInteraction(type: string, userId: string, details?: any): void {
    this.debug('User', `${type}: ${userId}`, details);
  }

  public security(event: string, userId: string, details?: any): void {
    this.warn('Security', `${event}: ${userId}`, details);
  }

  public performance(operation: string, duration: number, details?: any): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.addLog(level, 'Performance', `${operation}: ${duration}ms`, details);
    
    if (this.shouldLog(level)) {
      const message = `${operation}: ${duration}ms`;
      if (level === LogLevel.WARN) {
        console.warn(this.formatMessage('Performance', message, details));
      } else {
        console.log(this.formatMessage('Performance', message, details));
      }
    }
  }

  // Retrieve recent logs (useful for debugging)
  public getRecentLogs(count = 50, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-count);
  }

  // Get log statistics
  public getLogStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const log of this.logs) {
      const levelName = LogLevel[log.level];
      stats[levelName] = (stats[levelName] || 0) + 1;
    }
    
    return stats;
  }

  // Clear old logs
  public clearLogs(): void {
    this.logs = [];
  }

  // Set log level dynamically
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info('Logger', `Log level changed to ${LogLevel[level]}`);
  }

  // Export logs for debugging
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
export const logger = new BotLogger();

// Helper functions for backward compatibility and ease of use
export const logError = (component: string, message: string, metadata?: any) => 
  logger.error(component, message, metadata);

export const logWarn = (component: string, message: string, metadata?: any) => 
  logger.warn(component, message, metadata);

export const logInfo = (component: string, message: string, metadata?: any) => 
  logger.info(component, message, metadata);

export const logDebug = (component: string, message: string, metadata?: any) => 
  logger.debug(component, message, metadata);

// Development-only logging
export const devLog = (component: string, message: string, metadata?: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(component, message, metadata);
  }
};

export { LogLevel, BotLogger }; 