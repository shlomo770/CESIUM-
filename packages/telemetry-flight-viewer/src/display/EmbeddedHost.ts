/**
 * @module display/EmbeddedHost
 * @description Mounts the viewer inside the consumer container at 100% width/height.
 */

import type { DimensionValue, ResolvedTelemetryFlightViewerConfig } from "../types/config";
import {
  createViewerRoot,
  createViewerViewport,
  type DisplayHost
} from "./DisplayHost";

const MODE_CLASS = "tfv-root--embedded";

/**
 * Fills the supplied container with the viewer viewport and canvas stack.
 */
export class EmbeddedHost implements DisplayHost {
  readonly root: HTMLDivElement;
  readonly viewport: HTMLDivElement;
  readonly dragHandle = undefined;

  private mounted = false;

  /**
   * @param config - Resolved viewer configuration.
   */
  constructor(private readonly config: ResolvedTelemetryFlightViewerConfig) {
    this.root = createViewerRoot(MODE_CLASS, config.className);
    this.viewport = createViewerViewport();
    this.root.appendChild(this.viewport);
  }

  /**
   * Clears the container and appends the viewer root so it fills the parent.
   */
  mount(): void {
    if (this.mounted) return;

    const { container } = this.config;

    container.innerHTML = "";
    container.style.position = container.style.position || "relative";
    container.style.overflow = container.style.overflow || "hidden";

    container.appendChild(this.root);

    this.applyDimensions(
      this.config.dimensions.width,
      this.config.dimensions.height
    );

    this.mounted = true;
  }

  /**
   * Applies width/height to the root; viewport always stretches to 100%.
   */
  applyDimensions(width: DimensionValue, height: DimensionValue): void {
    const widthCss = width === "auto" ? "100%" : `${width}px`;
    const heightCss = height === "auto" ? "100%" : `${height}px`;

    this.root.style.width = widthCss;
    this.root.style.height = heightCss;
    this.root.style.minWidth = "0";
    this.root.style.minHeight = "0";

    this.viewport.style.width = "100%";
    this.viewport.style.height = "100%";
    this.viewport.style.minHeight = "0";

    if (width !== "auto" && height !== "auto") {
      this.config.container.style.width = widthCss;
      this.config.container.style.height = heightCss;
    } else {
      this.config.container.style.width = "100%";
      this.config.container.style.height = "100%";
    }
  }

  /**
   * Removes the viewer root from the DOM.
   */
  dispose(): void {
    this.root.remove();
    this.mounted = false;
  }
}
