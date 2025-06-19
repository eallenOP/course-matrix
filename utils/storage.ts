/**
 * Robust localStorage wrapper with error handling and recovery
 */

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StorageOptions {
  retries?: number;
  fallback?: any;
  onError?: (error: Error) => void;
}

class StorageManager {
  private static instance: StorageManager;
  private isStorageAvailable: boolean = true;
  private errorCallback?: (error: Error) => void;

  constructor() {
    // Add safety check for browser environment
    if (typeof window !== 'undefined') {
      this.checkStorageAvailability();
    } else {
      this.isStorageAvailable = false;
    }
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private checkStorageAvailability(): void {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isStorageAvailable = true;
    } catch (error) {
      console.warn('localStorage is not available:', error);
      this.isStorageAvailable = false;
    }
  }

  private handleError(error: Error, operation: string): void {
    console.error(`Storage ${operation} failed:`, error);
    
    if (this.errorCallback) {
      this.errorCallback(error);
    }

    // Check if storage became unavailable
    if (error.name === 'QuotaExceededError' || error.name === 'SecurityError') {
      this.isStorageAvailable = false;
    }
  }

  setErrorCallback(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Safely store data in localStorage with error handling
   */
  async setItem<T>(key: string, value: T, options: StorageOptions = {}): Promise<StorageResult<void>> {
    const { retries = 2, onError } = options;
    
    if (!this.isStorageAvailable) {
      return {
        success: false,
        error: 'Storage is not available'
      };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        
        // Verify the data was stored correctly
        const stored = localStorage.getItem(key);
        if (stored !== serialized) {
          throw new Error('Data verification failed after storage');
        }
        
        return { success: true };
      } catch (error) {
        const err = error as Error;
        this.handleError(err, 'setItem');
        
        if (onError) {
          onError(err);
        }

        // If this is a quota error, try to clear some space
        if (err.name === 'QuotaExceededError' && attempt < retries) {
          await this.clearOldData();
          continue;
        }

        // If this is the last attempt, return the error
        if (attempt === retries) {
          return {
            success: false,
            error: `Failed to store data: ${err.message}`
          };
        }
      }
    }

    return {
      success: false,
      error: 'Unexpected error in setItem'
    };
  }

  /**
   * Safely retrieve data from localStorage with error handling
   */
  getItem<T>(key: string, options: StorageOptions = {}): StorageResult<T> {
    const { fallback, onError } = options;
    
    if (!this.isStorageAvailable) {
      return {
        success: false,
        data: fallback,
        error: 'Storage is not available'
      };
    }

    try {
      const item = localStorage.getItem(key);
      
      if (item === null) {
        return {
          success: true,
          data: fallback
        };
      }

      const parsed = JSON.parse(item);
      return {
        success: true,
        data: parsed
      };
    } catch (error) {
      const err = error as Error;
      this.handleError(err, 'getItem');
      
      if (onError) {
        onError(err);
      }

      return {
        success: false,
        data: fallback,
        error: `Failed to retrieve data: ${err.message}`
      };
    }
  }

  /**
   * Remove an item from localStorage
   */
  removeItem(key: string): StorageResult<void> {
    if (!this.isStorageAvailable) {
      return {
        success: false,
        error: 'Storage is not available'
      };
    }

    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      this.handleError(err, 'removeItem');
      return {
        success: false,
        error: `Failed to remove data: ${err.message}`
      };
    }
  }

  /**
   * Clear old data to free up space
   */
  private async clearOldData(): Promise<void> {
    try {
      // Remove temporary or less important data first
      const keysToCheck = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('temp_') || key.includes('cache_'))) {
          keysToCheck.push(key);
        }
      }

      // Remove temporary keys
      keysToCheck.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore errors when cleaning up
        }
      });
    } catch (error) {
      console.warn('Failed to clear old data:', error);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: boolean; keys: string[] } {
    if (!this.isStorageAvailable) {
      return { used: 0, available: false, keys: [] };
    }

    try {
      let used = 0;
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }

      return { used, available: true, keys };
    } catch (error) {
      console.warn('Failed to get storage info:', error);
      return { used: 0, available: false, keys: [] };
    }
  }

  /**
   * Test storage functionality
   */
  testStorage(): boolean {
    try {
      const testKey = '__storage_test_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      localStorage.setItem(testKey, JSON.stringify(testValue));
      const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');
      localStorage.removeItem(testKey);
      
      return retrieved.test === true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const storage = StorageManager.getInstance();

// Export convenience functions
export const safeSetItem = <T>(key: string, value: T, options?: StorageOptions) => 
  storage.setItem(key, value, options);

export const safeGetItem = <T>(key: string, options?: StorageOptions) => 
  storage.getItem<T>(key, options);

export const safeRemoveItem = (key: string) => 
  storage.removeItem(key);
