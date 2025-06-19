import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, retryCount: number) => void;
}

class APIRetryService {
  private defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    retryCondition: (error: any) => {
      // Retry on network errors, 5xx errors, and specific 4xx errors
      if (!error.response) return true; // Network error
      
      const status = error.response.status;
      return (
        status >= 500 || // Server errors
        status === 408 || // Request timeout
        status === 429 || // Too many requests
        status === 503 || // Service unavailable
        status === 504    // Gateway timeout
      );
    },
    onRetry: (error: any, retryCount: number) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[APIRetry] Attempt ${retryCount} failed, retrying...`, error.message);
      }
    }
  };

  public async makeRequest<T = any>(
    config: AxiosRequestConfig,
    retryConfig: RetryConfig = {}
  ): Promise<AxiosResponse<T>> {
    const finalConfig = { ...this.defaultConfig, ...retryConfig };
    let lastError: any;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await axios(config);
      } catch (error: any) {
        lastError = error;

        // Don't retry if it's the last attempt or retry condition is not met
        if (attempt === finalConfig.maxRetries || !finalConfig.retryCondition(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          finalConfig.maxDelay
        );

        finalConfig.onRetry(error, attempt + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Convenience methods for common HTTP methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig, retryConfig?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>({ ...config, method: 'GET', url }, retryConfig);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>({ ...config, method: 'POST', url, data }, retryConfig);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>({ ...config, method: 'PUT', url, data }, retryConfig);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig, retryConfig?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>({ ...config, method: 'PATCH', url, data }, retryConfig);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig, retryConfig?: RetryConfig): Promise<AxiosResponse<T>> {
    return this.makeRequest<T>({ ...config, method: 'DELETE', url }, retryConfig);
  }
}

// Global instance
export const apiRetryService = new APIRetryService();

// Error categorization utility
export class APIErrorHandler {
  public static categorizeError(error: any): {
    type: 'network' | 'client' | 'server' | 'timeout' | 'auth' | 'notFound' | 'rateLimit' | 'unknown';
    userMessage: string;
    shouldRetry: boolean;
    retryAfter?: number;
  } {
    // Network errors (no response)
    if (!error.response) {
      return {
        type: 'network',
        userMessage: 'Unable to connect to Labnex servers. Please check your connection and try again.',
        shouldRetry: true
      };
    }

    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 401:
        return {
          type: 'auth',
          userMessage: 'Authentication failed. Please re-link your Discord account using `/linkaccount`.',
          shouldRetry: false
        };

      case 403:
        return {
          type: 'auth',
          userMessage: 'You don\'t have permission to perform this action. Check your account privileges.',
          shouldRetry: false
        };

      case 404:
        return {
          type: 'notFound',
          userMessage: data?.message || 'The requested resource was not found.',
          shouldRetry: false
        };

      case 408:
        return {
          type: 'timeout',
          userMessage: 'Request timed out. Please try again.',
          shouldRetry: true
        };

      case 429:
        const retryAfter = error.response.headers['retry-after'];
        return {
          type: 'rateLimit',
          userMessage: `Too many requests. Please wait ${retryAfter ? `${retryAfter} seconds` : 'a moment'} and try again.`,
          shouldRetry: true,
          retryAfter: retryAfter ? parseInt(retryAfter) * 1000 : 60000
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          userMessage: 'Labnex servers are experiencing issues. Please try again in a few moments.',
          shouldRetry: true
        };

      default:
        if (status >= 400 && status < 500) {
          return {
            type: 'client',
            userMessage: data?.message || 'Invalid request. Please check your input and try again.',
            shouldRetry: false
          };
        }

        return {
          type: 'unknown',
          userMessage: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
          shouldRetry: false
        };
    }
  }

  public static async handleError(
    error: any,
    replyFunction: (content: string, ephemeral?: boolean) => Promise<void>
  ): Promise<void> {
    const categorized = this.categorizeError(error);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`[APIError] Type: ${categorized.type}, Status: ${error.response?.status}, Message:`, error.message);
    }

    await replyFunction(categorized.userMessage, true);
  }
}

export default apiRetryService; 