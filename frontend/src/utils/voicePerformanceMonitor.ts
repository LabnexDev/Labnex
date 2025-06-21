/**
 * Voice Performance Monitor
 * Tracks and optimizes performance metrics for Voice Mode
 */

interface PerformanceMetrics {
  speechRecognitionLatency: number[];
  ttsLatency: number[];
  commandProcessingTime: number[];
  errorRate: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkLatency: number[];
  frameRate: number;
}

interface DeviceCapabilities {
  isMobile: boolean;
  isLowPowerDevice: boolean;
  supportsWebSpeech: boolean;
  supportsBatteryAPI: boolean;
  maxConcurrentAnimations: number;
  recommendedParticleCount: number;
}

class VoicePerformanceMonitor {
  private metrics: PerformanceMetrics = {
    speechRecognitionLatency: [],
    ttsLatency: [],
    commandProcessingTime: [],
    errorRate: 0,
    memoryUsage: 0,
    networkLatency: [],
    frameRate: 60
  };

  private deviceCapabilities: DeviceCapabilities;
  private totalRequests = 0;
  private errorCount = 0;
  private frameRateMonitor: number | null = null;
  private lastFrameTime = 0;
  private frameCount = 0;

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.startFrameRateMonitoring();
    this.monitorMemoryUsage();
  }

  /**
   * Detect device capabilities for optimization
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                     || window.innerWidth < 768;
    
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isLowPowerDevice = hardwareConcurrency < 4 || isMobile;
    
    const supportsWebSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const supportsBatteryAPI = 'getBattery' in navigator;
    
    return {
      isMobile,
      isLowPowerDevice,
      supportsWebSpeech,
      supportsBatteryAPI,
      maxConcurrentAnimations: isLowPowerDevice ? 3 : 8,
      recommendedParticleCount: isLowPowerDevice ? (isMobile ? 8 : 15) : 30
    };
  }

  /**
   * Monitor frame rate for performance optimization
   */
  private startFrameRateMonitoring() {
    const measureFrameRate = (timestamp: number) => {
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        this.frameCount++;
        
        // Calculate FPS every second
        if (this.frameCount % 60 === 0) {
          this.metrics.frameRate = Math.round(1000 / (delta / this.frameCount));
          this.frameCount = 0;
        }
      }
      this.lastFrameTime = timestamp;
      this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
    };
    
    this.frameRateMonitor = requestAnimationFrame(measureFrameRate);
  }

  /**
   * Monitor memory usage if available
   */
  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }, 5000);
    }
  }

  /**
   * Track speech recognition performance
   */
  trackSpeechRecognition(startTime: number, endTime: number, success: boolean) {
    const latency = endTime - startTime;
    this.metrics.speechRecognitionLatency.push(latency);
    
    // Keep only last 50 measurements
    if (this.metrics.speechRecognitionLatency.length > 50) {
      this.metrics.speechRecognitionLatency.shift();
    }
    
    this.totalRequests++;
    if (!success) {
      this.errorCount++;
    }
    this.metrics.errorRate = this.errorCount / this.totalRequests;
  }

  /**
   * Track TTS performance
   */
  trackTTSPerformance(startTime: number, endTime: number) {
    const latency = endTime - startTime;
    this.metrics.ttsLatency.push(latency);
    
    if (this.metrics.ttsLatency.length > 50) {
      this.metrics.ttsLatency.shift();
    }
  }

  /**
   * Track command processing time
   */
  trackCommandProcessing(startTime: number, endTime: number) {
    const processingTime = endTime - startTime;
    this.metrics.commandProcessingTime.push(processingTime);
    
    if (this.metrics.commandProcessingTime.length > 50) {
      this.metrics.commandProcessingTime.shift();
    }
  }

  /**
   * Track network latency
   */
  trackNetworkLatency(startTime: number, endTime: number) {
    const latency = endTime - startTime;
    this.metrics.networkLatency.push(latency);
    
    if (this.metrics.networkLatency.length > 50) {
      this.metrics.networkLatency.shift();
    }
  }

  /**
   * Get optimization recommendations based on current metrics
   */
  getOptimizationRecommendations(): {
    reducedAnimations: boolean;
    lowerParticleCount: boolean;
    reducedBlur: boolean;
    disableAdvancedEffects: boolean;
    batteryOptimizations: boolean;
  } {
    const avgFrameRate = this.metrics.frameRate;
    const highMemoryUsage = this.metrics.memoryUsage > 0.8;
    const slowDevice = this.deviceCapabilities.isLowPowerDevice;
    
    return {
      reducedAnimations: avgFrameRate < 30 || slowDevice,
      lowerParticleCount: avgFrameRate < 45 || highMemoryUsage || slowDevice,
      reducedBlur: avgFrameRate < 40 || slowDevice,
      disableAdvancedEffects: avgFrameRate < 25 || highMemoryUsage,
      batteryOptimizations: this.deviceCapabilities.isMobile
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * Get average latency for a metric
   */
  private getAverageLatency(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      avgSpeechRecognitionLatency: this.getAverageLatency(this.metrics.speechRecognitionLatency),
      avgTTSLatency: this.getAverageLatency(this.metrics.ttsLatency),
      avgCommandProcessingTime: this.getAverageLatency(this.metrics.commandProcessingTime),
      avgNetworkLatency: this.getAverageLatency(this.metrics.networkLatency),
      errorRate: this.metrics.errorRate,
      frameRate: this.metrics.frameRate,
      memoryUsage: this.metrics.memoryUsage,
      deviceCapabilities: this.deviceCapabilities,
      recommendations: this.getOptimizationRecommendations()
    };
  }

  /**
   * Log performance issues
   */
  logPerformanceIssue(issue: string, severity: 'low' | 'medium' | 'high') {
    const summary = this.getPerformanceSummary();
    console.warn(`Voice Performance Issue [${severity.toUpperCase()}]:`, {
      issue,
      timestamp: new Date().toISOString(),
      metrics: summary
    });
    
    // In production, you might want to send this to an analytics service
    if (severity === 'high') {
      // Could send to error tracking service
    }
  }

  /**
   * Check if device should use low power mode
   */
  shouldUseLowPowerMode(): boolean {
    const recommendations = this.getOptimizationRecommendations();
    return recommendations.disableAdvancedEffects || 
           (this.deviceCapabilities.isMobile && this.metrics.frameRate < 40);
  }

  /**
   * Get recommended particle count based on performance
   */
  getRecommendedParticleCount(): number {
    const recommendations = this.getOptimizationRecommendations();
    
    if (recommendations.disableAdvancedEffects) return 0;
    if (recommendations.lowerParticleCount) {
      return Math.max(5, Math.floor(this.deviceCapabilities.recommendedParticleCount * 0.5));
    }
    
    return this.deviceCapabilities.recommendedParticleCount;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.frameRateMonitor) {
      cancelAnimationFrame(this.frameRateMonitor);
      this.frameRateMonitor = null;
    }
  }
}

// Singleton instance
export const voicePerformanceMonitor = new VoicePerformanceMonitor();

// Export helper functions
export const useVoicePerformance = () => {
  return {
    trackSpeechRecognition: voicePerformanceMonitor.trackSpeechRecognition.bind(voicePerformanceMonitor),
    trackTTSPerformance: voicePerformanceMonitor.trackTTSPerformance.bind(voicePerformanceMonitor),
    trackCommandProcessing: voicePerformanceMonitor.trackCommandProcessing.bind(voicePerformanceMonitor),
    trackNetworkLatency: voicePerformanceMonitor.trackNetworkLatency.bind(voicePerformanceMonitor),
    getOptimizationRecommendations: voicePerformanceMonitor.getOptimizationRecommendations.bind(voicePerformanceMonitor),
    getPerformanceSummary: voicePerformanceMonitor.getPerformanceSummary.bind(voicePerformanceMonitor),
    shouldUseLowPowerMode: voicePerformanceMonitor.shouldUseLowPowerMode.bind(voicePerformanceMonitor),
    getRecommendedParticleCount: voicePerformanceMonitor.getRecommendedParticleCount.bind(voicePerformanceMonitor),
    logPerformanceIssue: voicePerformanceMonitor.logPerformanceIssue.bind(voicePerformanceMonitor)
  };
};

export default VoicePerformanceMonitor; 