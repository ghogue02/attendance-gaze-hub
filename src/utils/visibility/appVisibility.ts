
/**
 * Utility to track application visibility state
 * Used to reduce unnecessary network requests when the app is in background
 */

type VisibilityCallback = (isVisible: boolean) => void;

class AppVisibilityTracker {
  private static instance: AppVisibilityTracker;
  private callbacks: Set<VisibilityCallback> = new Set();
  private isVisible: boolean = true;
  private isSetup: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): AppVisibilityTracker {
    if (!AppVisibilityTracker.instance) {
      AppVisibilityTracker.instance = new AppVisibilityTracker();
    }
    return AppVisibilityTracker.instance;
  }

  /**
   * Set up visibility change detection
   */
  private setupVisibilityDetection(): void {
    if (this.isSetup || typeof document === 'undefined') return;
    
    // Initial state
    this.isVisible = !document.hidden;
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      this.notifyCallbacks();
      
      // Log visibility changes for debugging
      console.log(`[AppVisibility] Document visibility changed to: ${this.isVisible ? 'visible' : 'hidden'}`);
    });
    
    this.isSetup = true;
  }

  /**
   * Subscribe to visibility changes
   */
  public subscribe(callback: VisibilityCallback): () => void {
    this.setupVisibilityDetection();
    this.callbacks.add(callback);
    
    // Immediately call with current state
    callback(this.isVisible);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current visibility without subscribing
   */
  public getVisibility(): boolean {
    this.setupVisibilityDetection();
    return this.isVisible;
  }

  /**
   * Notify all callbacks of visibility changes
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.isVisible);
      } catch (error) {
        console.error('[AppVisibility] Error in visibility callback:', error);
      }
    });
  }
}

// Export a singleton instance
export const appVisibility = AppVisibilityTracker.getInstance();

/**
 * React hook for using visibility in components
 */
export const useAppVisibility = (): boolean => {
  const [isVisible, setIsVisible] = React.useState<boolean>(appVisibility.getVisibility());
  
  React.useEffect(() => {
    return appVisibility.subscribe(visible => {
      setIsVisible(visible);
    });
  }, []);
  
  return isVisible;
};
