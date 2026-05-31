/**
 * @module display/DisplayHost
 * @description Contract for mounting the viewer into the consumer DOM.
 */

import type { DimensionValue } from "../types/config";

/**
 * Abstraction for embedded vs. floating viewer placement.
 */
export interface DisplayHost {
  /** Root wrapper containing the viewport (and floating chrome, if any). */
  readonly root: HTMLElement;

  /**
   * Region where the WebGL canvas and HUD are mounted.
   * Resize observers should target this element.
   */
  readonly viewport: HTMLElement;

  /**
   * Drag handle for floating mode; `undefined` in embedded mode.
   */
  readonly dragHandle?: HTMLElement;

  /** Attaches the viewer structure to the configured container. */
  mount(): void;

  /**
   * Applies explicit or automatic dimensions.
   *
   * @param width - Pixel width or `'auto'`.
   * @param height - Pixel height or `'auto'`.
   */
  applyDimensions(width: DimensionValue, height: DimensionValue): void;

  /** Removes DOM nodes and detaches interaction handlers. */
  dispose(): void;
}

/**
 * Creates the shared viewport element used by all display modes.
 */
export function createViewerViewport(): HTMLDivElement {
  const viewport = document.createElement("div");
  viewport.className = "tfv-viewport";
  viewport.setAttribute("data-tfv-viewport", "true");
  return viewport;
}

/**
 * Builds the viewer root shell with optional extra CSS classes.
 */
export function createViewerRoot(
  modeClass: string,
  className?: string
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = ["tfv-root", modeClass, className].filter(Boolean).join(" ");
  return root;
}
