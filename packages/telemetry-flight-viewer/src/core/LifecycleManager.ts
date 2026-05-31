type Disposer = () => void;

/**
 * Central registry for teardown callbacks (RAII-style).
 */
export class LifecycleManager {
  private readonly disposers: Disposer[] = [];
  private destroyed = false;

  register(disposer: Disposer): void {
    if (this.destroyed) {
      disposer();
      return;
    }
    this.disposers.push(disposer);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    while (this.disposers.length > 0) {
      const disposer = this.disposers.pop();
      try {
        disposer?.();
      } catch (error) {
        console.error("[TelemetryFlightViewer] dispose error:", error);
      }
    }
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }
}
