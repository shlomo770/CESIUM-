/**
 * @module interaction/DragController
 * @description Zero-dependency pointer dragging for floating viewer panels.
 */

/**
 * Options for {@link DragController}.
 */
export interface DragControllerOptions {
  /** Element that initiates a drag (typically the panel header). */
  handle: HTMLElement;

  /** Element whose `left`/`top` position is updated while dragging. */
  target: HTMLElement;

  /** Minimum distance from viewport edges in pixels. @defaultValue 8 */
  margin?: number;

  /** Whether dragging is active. @defaultValue true */
  enabled?: boolean;
}

/**
 * Pointer-driven drag controller that keeps a panel within the viewport.
 */
export class DragController {
  private readonly margin: number;
  private enabled: boolean;
  private disposed = false;
  private dragging = false;
  private pointerId: number | null = null;
  private offsetX = 0;
  private offsetY = 0;

  private readonly onPointerDown: (event: PointerEvent) => void;
  private readonly onPointerMove: (event: PointerEvent) => void;
  private readonly onPointerUp: (event: PointerEvent) => void;

  /**
   * @param options - Handle, target, and boundary settings.
   */
  constructor(private readonly options: DragControllerOptions) {
    this.margin = options.margin ?? 8;
    this.enabled = options.enabled ?? true;

    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);

    const { handle } = options;
    handle.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
  }

  /**
   * Enables or disables drag initiation without removing listeners.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.dragging) {
      this.endDrag();
    }
  }

  /**
   * Returns true while the user is actively dragging.
   */
  isDragging(): boolean {
    return this.dragging;
  }

  /**
   * Removes all pointer listeners and ends an active drag session.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.endDrag();

    const { handle } = this.options;
    handle.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
  }

  private handlePointerDown(event: PointerEvent): void {
    if (this.disposed || !this.enabled || event.button !== 0) return;

    const { handle, target } = this.options;
    const rect = target.getBoundingClientRect();

    this.dragging = true;
    this.pointerId = event.pointerId;
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;

    this.clearAnchorStyles(target);
    handle.setPointerCapture(event.pointerId);
    target.classList.add("tfv-floating--dragging");
    handle.classList.add("tfv-floating__header--active");

    event.preventDefault();
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.dragging || this.pointerId !== event.pointerId) return;

    const { target } = this.options;
    const width = target.offsetWidth;
    const height = target.offsetHeight;

    const maxLeft = Math.max(this.margin, window.innerWidth - width - this.margin);
    const maxTop = Math.max(this.margin, window.innerHeight - height - this.margin);

    const left = clamp(event.clientX - this.offsetX, this.margin, maxLeft);
    const top = clamp(event.clientY - this.offsetY, this.margin, maxTop);

    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    target.style.right = "auto";
    target.style.bottom = "auto";
    target.style.transform = "none";
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    this.endDrag();
  }

  private endDrag(): void {
    if (!this.dragging) return;

    const { handle, target } = this.options;

    if (this.pointerId !== null) {
      try {
        handle.releasePointerCapture(this.pointerId);
      } catch {
        // Pointer may already be released if the browser ended the session.
      }
    }

    this.dragging = false;
    this.pointerId = null;
    target.classList.remove("tfv-floating--dragging");
    handle.classList.remove("tfv-floating__header--active");
  }

  /**
   * Converts anchored positioning (top/right/bottom/left) into absolute coordinates.
   */
  private clearAnchorStyles(target: HTMLElement): void {
    const rect = target.getBoundingClientRect();
    target.style.position = "fixed";
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    target.style.right = "auto";
    target.style.bottom = "auto";
    target.style.transform = "none";
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
