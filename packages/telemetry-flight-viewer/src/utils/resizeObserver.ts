export type ResizeCallback = (width: number, height: number) => void;

/**
 * Thin wrapper around ResizeObserver with safe teardown.
 */
export class ElementResizeWatcher {
  private observer: ResizeObserver | null = null;

  constructor(
    private readonly element: HTMLElement,
    private readonly onResize: ResizeCallback
  ) {}

  start(): void {
    if (typeof ResizeObserver === "undefined") {
      this.emitCurrent();
      window.addEventListener("resize", this.onWindowResize);
      return;
    }

    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        this.onResize(width, height);
      }
    });

    this.observer.observe(this.element);
    this.emitCurrent();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener("resize", this.onWindowResize);
  }

  private readonly onWindowResize = (): void => {
    this.emitCurrent();
  };

  private emitCurrent(): void {
    const rect = this.element.getBoundingClientRect();
    const width = rect.width || this.element.clientWidth;
    const height = rect.height || this.element.clientHeight;
    if (width > 0 && height > 0) {
      this.onResize(width, height);
    }
  }
}
