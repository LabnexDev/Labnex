import type { OpenAI } from 'openai';

interface ConversationEntry {
  history: OpenAI.Chat.ChatCompletionMessageParam[];
  lastActivity: number;
  messageCount: number;
}

class ConversationManager {
  private conversations = new Map<string, ConversationEntry>();
  private cleanupInterval!: NodeJS.Timeout;
  
  // Configuration
  private readonly maxContextMessages = 10;
  private readonly conversationTimeoutMs = 30 * 60 * 1000; // 30 minutes
  private readonly maxConversations = 1000; // Prevent unlimited growth
  private readonly cleanupIntervalMs = 5 * 60 * 1000; // Cleanup every 5 minutes

  constructor() {
    this.startCleanupSchedule();
  }

  public addMessage(userId: string, role: 'user' | 'assistant', content: string): void {
    const now = Date.now();
    let conversation = this.conversations.get(userId);

    if (!conversation) {
      conversation = {
        history: [],
        lastActivity: now,
        messageCount: 0
      };
      this.conversations.set(userId, conversation);
    }

    // Add new message
    conversation.history.push({ role, content });
    conversation.lastActivity = now;
    conversation.messageCount++;

    // Trim history if it exceeds max messages
    if (conversation.history.length > this.maxContextMessages) {
      // Keep system message if it exists, trim from the beginning
      const systemMessage = conversation.history.find(msg => msg.role === 'system');
      const trimmed = conversation.history.slice(-this.maxContextMessages);
      
      if (systemMessage && trimmed[0]?.role !== 'system') {
        conversation.history = [systemMessage, ...trimmed.slice(1)];
      } else {
        conversation.history = trimmed;
      }
    }

    // Enforce max conversations limit
    if (this.conversations.size > this.maxConversations) {
      this.cleanupOldConversations(true);
    }
  }

  public getConversationHistory(userId: string): OpenAI.Chat.ChatCompletionMessageParam[] {
    const conversation = this.conversations.get(userId);
    if (!conversation) {
      return [];
    }

    // Update last activity
    conversation.lastActivity = Date.now();
    return [...conversation.history]; // Return copy to prevent external modification
  }

  public hasActiveConversation(userId: string): boolean {
    const conversation = this.conversations.get(userId);
    if (!conversation) {
      return false;
    }

    const now = Date.now();
    const isActive = (now - conversation.lastActivity) < this.conversationTimeoutMs;
    
    if (!isActive) {
      this.conversations.delete(userId);
      return false;
    }

    return true;
  }

  public clearConversation(userId: string): void {
    this.conversations.delete(userId);
  }

  public clearAllConversations(): void {
    this.conversations.clear();
  }

  public getActiveConversationCount(): number {
    return this.conversations.size;
  }

  public getConversationStats(userId: string): { messageCount: number; lastActivity: Date } | null {
    const conversation = this.conversations.get(userId);
    if (!conversation) {
      return null;
    }

    return {
      messageCount: conversation.messageCount,
      lastActivity: new Date(conversation.lastActivity)
    };
  }

  private startCleanupSchedule(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldConversations();
    }, this.cleanupIntervalMs);
  }

  private cleanupOldConversations(forceful = false): void {
    const now = Date.now();
    const conversationsToDelete: string[] = [];

    for (const [userId, conversation] of this.conversations.entries()) {
      const age = now - conversation.lastActivity;
      
      if (forceful || age > this.conversationTimeoutMs) {
        conversationsToDelete.push(userId);
      }
    }

    // If forceful cleanup and still too many, remove oldest conversations
    if (forceful && this.conversations.size > this.maxConversations) {
      const sortedByAge = Array.from(this.conversations.entries())
        .sort(([, a], [, b]) => a.lastActivity - b.lastActivity);
      
      const excessCount = this.conversations.size - this.maxConversations;
      for (let i = 0; i < excessCount; i++) {
        conversationsToDelete.push(sortedByAge[i][0]);
      }
    }

    // Remove conversations
    for (const userId of conversationsToDelete) {
      this.conversations.delete(userId);
    }

    if (process.env.NODE_ENV === 'development' && conversationsToDelete.length > 0) {
      console.log(`[ConversationManager] Cleaned up ${conversationsToDelete.length} old conversations. Active: ${this.conversations.size}`);
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clearAllConversations();
  }

  // Get memory usage statistics
  public getMemoryStats(): {
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    oldestConversationAge: number;
    newestConversationAge: number;
  } {
    const now = Date.now();
    let totalMessages = 0;
    let oldestAge = 0;
    let newestAge = Infinity;

    for (const conversation of this.conversations.values()) {
      totalMessages += conversation.history.length;
      const age = now - conversation.lastActivity;
      oldestAge = Math.max(oldestAge, age);
      newestAge = Math.min(newestAge, age);
    }

    return {
      totalConversations: this.conversations.size,
      totalMessages,
      averageMessagesPerConversation: this.conversations.size > 0 ? totalMessages / this.conversations.size : 0,
      oldestConversationAge: oldestAge,
      newestConversationAge: newestAge === Infinity ? 0 : newestAge
    };
  }
}

// Global conversation manager instance
export const conversationManager = new ConversationManager();

// Graceful shutdown handler
process.on('SIGINT', () => {
  conversationManager.destroy();
});

process.on('SIGTERM', () => {
  conversationManager.destroy();
});

export { ConversationManager }; 