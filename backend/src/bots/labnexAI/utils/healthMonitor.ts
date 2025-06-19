import { logger } from './logger';
import { conversationManager } from './conversationManager';
import { commandRateLimiter, apiRateLimiter, aiRateLimiter } from './rateLimiter';

interface HealthMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  eventLoopDelay: number;
  activeConnections: number;
  commandsProcessed: number;
  errorsInLastHour: number;
  apiCallsInLastHour: number;
  rateLimitHits: number;
  conversationCount: number;
  lastHealthCheck: number;
}

interface PerformanceAlert {
  type: 'memory' | 'eventLoop' | 'errors' | 'rateLimits' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  metadata?: any;
}

class BotHealthMonitor {
  private startTime: number;
  private metrics: HealthMetrics;
  private alerts: PerformanceAlert[] = [];
  private maxAlerts = 100;
  private healthCheckInterval!: NodeJS.Timeout;
  
  // Counters
  private commandsProcessed = 0;
  private apiCallsInLastHour = 0;
  private errorsInLastHour = 0;
  private rateLimitHits = 0;
  
  // Circular buffers for tracking rates
  private errorTimestamps: number[] = [];
  private apiCallTimestamps: number[] = [];
  
  // Thresholds
  private readonly thresholds = {
    memoryUsagePercent: 85, // Alert if memory usage > 85%
    eventLoopDelay: 100, // Alert if event loop delay > 100ms
    errorsPerHour: 50, // Alert if errors > 50 per hour
    apiCallsPerHour: 1000, // Alert if API calls > 1000 per hour
    rateLimitHitsPerHour: 10 // Alert if rate limit hits > 10 per hour
  };

  constructor() {
    this.startTime = Date.now();
    this.metrics = this.getInitialMetrics();
    this.startHealthMonitoring();
    this.setupProcessListeners();
  }

  private getInitialMetrics(): HealthMetrics {
    return {
      uptime: 0,
      memoryUsage: process.memoryUsage(),
      eventLoopDelay: 0,
      activeConnections: 0,
      commandsProcessed: 0,
      errorsInLastHour: 0,
      apiCallsInLastHour: 0,
      rateLimitHits: 0,
      conversationCount: 0,
      lastHealthCheck: Date.now()
    };
  }

  private startHealthMonitoring(): void {
    // Run health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  private setupProcessListeners(): void {
    // Monitor uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.recordError('UncaughtException', error);
      logger.error('HealthMonitor', 'Uncaught exception detected', { error: error.message, stack: error.stack });
    });

    // Monitor unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.recordError('UnhandledRejection', reason);
      logger.error('HealthMonitor', 'Unhandled promise rejection detected', { reason, promise });
    });

    // Monitor warnings
    process.on('warning', (warning) => {
      logger.warn('HealthMonitor', 'Process warning detected', { 
        name: warning.name, 
        message: warning.message 
      });
    });
  }

  public recordCommand(commandName: string, success: boolean, duration: number): void {
    this.commandsProcessed++;
    
    if (!success) {
      this.recordError('CommandFailure', { commandName, duration });
    }

    // Log slow commands
    if (duration > 5000) {
      this.addAlert({
        type: 'api',
        severity: 'medium',
        message: `Slow command detected: ${commandName} took ${duration}ms`,
        timestamp: Date.now(),
        metadata: { commandName, duration }
      });
    }
  }

  public recordAPICall(method: string, url: string, status: number, duration: number): void {
    const now = Date.now();
    this.apiCallTimestamps.push(now);
    
    // Keep only last hour's data
    this.apiCallTimestamps = this.apiCallTimestamps.filter(timestamp => 
      now - timestamp < 3600000 // 1 hour
    );
    
    this.apiCallsInLastHour = this.apiCallTimestamps.length;

    // Record errors
    if (status >= 400) {
      this.recordError('APIError', { method, url, status, duration });
    }

    // Record slow API calls
    if (duration > 10000) {
      this.addAlert({
        type: 'api',
        severity: 'medium',
        message: `Slow API call: ${method} ${url} took ${duration}ms`,
        timestamp: now,
        metadata: { method, url, status, duration }
      });
    }
  }

  public recordError(type: string, error: any): void {
    const now = Date.now();
    this.errorTimestamps.push(now);
    
    // Keep only last hour's data
    this.errorTimestamps = this.errorTimestamps.filter(timestamp => 
      now - timestamp < 3600000 // 1 hour
    );
    
    this.errorsInLastHour = this.errorTimestamps.length;

    logger.error('HealthMonitor', `Error recorded: ${type}`, { error });
  }

  public recordRateLimitHit(userId: string, type: string): void {
    this.rateLimitHits++;
    
    logger.warn('HealthMonitor', 'Rate limit hit', { userId, type });
    
    this.addAlert({
      type: 'rateLimits',
      severity: 'low',
      message: `Rate limit hit for user ${userId} (${type})`,
      timestamp: Date.now(),
      metadata: { userId, type }
    });
  }

  private performHealthCheck(): void {
    const now = Date.now();
    
    // Update basic metrics
    this.metrics.uptime = now - this.startTime;
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.commandsProcessed = this.commandsProcessed;
    this.metrics.errorsInLastHour = this.errorsInLastHour;
    this.metrics.apiCallsInLastHour = this.apiCallsInLastHour;
    this.metrics.rateLimitHits = this.rateLimitHits;
    this.metrics.conversationCount = conversationManager.getActiveConversationCount();
    this.metrics.lastHealthCheck = now;
    
    // Measure event loop delay
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delta = process.hrtime.bigint() - start;
      this.metrics.eventLoopDelay = Number(delta) / 1000000; // Convert to milliseconds
      
      this.checkThresholds();
    });
  }

  private checkThresholds(): void {
    // Check memory usage
    const memoryUsagePercent = (this.metrics.memoryUsage.heapUsed / this.metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > this.thresholds.memoryUsagePercent) {
      this.addAlert({
        type: 'memory',
        severity: memoryUsagePercent > 95 ? 'critical' : 'high',
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        timestamp: Date.now(),
        metadata: { memoryUsagePercent, memoryUsage: this.metrics.memoryUsage }
      });
    }

    // Check event loop delay
    if (this.metrics.eventLoopDelay > this.thresholds.eventLoopDelay) {
      this.addAlert({
        type: 'eventLoop',
        severity: this.metrics.eventLoopDelay > 500 ? 'high' : 'medium',
        message: `High event loop delay: ${this.metrics.eventLoopDelay.toFixed(1)}ms`,
        timestamp: Date.now(),
        metadata: { eventLoopDelay: this.metrics.eventLoopDelay }
      });
    }

    // Check error rate
    if (this.errorsInLastHour > this.thresholds.errorsPerHour) {
      this.addAlert({
        type: 'errors',
        severity: this.errorsInLastHour > 100 ? 'high' : 'medium',
        message: `High error rate: ${this.errorsInLastHour} errors in last hour`,
        timestamp: Date.now(),
        metadata: { errorsInLastHour: this.errorsInLastHour }
      });
    }

    // Check API call rate
    if (this.apiCallsInLastHour > this.thresholds.apiCallsPerHour) {
      this.addAlert({
        type: 'api',
        severity: 'medium',
        message: `High API call rate: ${this.apiCallsInLastHour} calls in last hour`,
        timestamp: Date.now(),
        metadata: { apiCallsInLastHour: this.apiCallsInLastHour }
      });
    }
  }

  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      logger.error('HealthMonitor', `CRITICAL ALERT: ${alert.message}`, alert.metadata);
    } else if (alert.severity === 'high') {
      logger.warn('HealthMonitor', `HIGH ALERT: ${alert.message}`, alert.metadata);
    }
  }

  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: HealthMetrics;
    alerts: PerformanceAlert[];
    summary: string;
  } {
    const recentAlerts = this.alerts.filter(alert => 
      Date.now() - alert.timestamp < 300000 // Last 5 minutes
    );

    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = recentAlerts.filter(alert => alert.severity === 'high');

    let status: 'healthy' | 'warning' | 'critical';
    let summary: string;

    if (criticalAlerts.length > 0) {
      status = 'critical';
      summary = `${criticalAlerts.length} critical issues detected`;
    } else if (highAlerts.length > 0 || recentAlerts.length > 5) {
      status = 'warning';
      summary = `${highAlerts.length} high priority issues, ${recentAlerts.length} total alerts`;
    } else {
      status = 'healthy';
      summary = 'All systems operating normally';
    }

    return {
      status,
      metrics: { ...this.metrics },
      alerts: recentAlerts,
      summary
    };
  }

  public getDetailedReport(): string {
    const health = this.getHealthStatus();
    const conversationStats = conversationManager.getMemoryStats();
    
    const report = [
      '=== Discord Bot Health Report ===',
      `Status: ${health.status.toUpperCase()}`,
      `Summary: ${health.summary}`,
      '',
      '--- System Metrics ---',
      `Uptime: ${Math.floor(health.metrics.uptime / 1000 / 60)} minutes`,
      `Memory: ${(health.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(health.metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
      `Event Loop Delay: ${health.metrics.eventLoopDelay.toFixed(1)}ms`,
      `Commands Processed: ${health.metrics.commandsProcessed}`,
      `Errors (1h): ${health.metrics.errorsInLastHour}`,
      `API Calls (1h): ${health.metrics.apiCallsInLastHour}`,
      `Rate Limit Hits: ${health.metrics.rateLimitHits}`,
      '',
      '--- Conversation Manager ---',
      `Active Conversations: ${conversationStats.totalConversations}`,
      `Total Messages: ${conversationStats.totalMessages}`,
      `Avg Messages/Conversation: ${conversationStats.averageMessagesPerConversation.toFixed(1)}`,
      '',
      '--- Recent Alerts ---',
      ...health.alerts.map(alert => 
        `[${alert.severity.toUpperCase()}] ${new Date(alert.timestamp).toLocaleTimeString()}: ${alert.message}`
      )
    ];

    return report.join('\n');
  }

  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Global health monitor instance
export const healthMonitor = new BotHealthMonitor();

// Graceful shutdown
process.on('SIGINT', () => {
  healthMonitor.destroy();
});

process.on('SIGTERM', () => {
  healthMonitor.destroy();
});

export { BotHealthMonitor, PerformanceAlert, HealthMetrics }; 