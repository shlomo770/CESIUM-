/**
 * @module display/FloatingHost
 * @description Renders the viewer inside a draggable floating overlay panel.
 */

import { DragController } from "../interaction/DragController";
import type {
  FloatingPosition,
  ResolvedTelemetryFlightViewerConfig
} from "../types/config";
import type { DimensionValue } from "../types/config";
import {
  createViewerRoot,
  createViewerViewport,
  type DisplayHost
} from "./DisplayHost";

const MODE_CLASS = "tfv-root--floating";

/**
 * Appends a fixed-position floating window with a drag header and sized viewport.
 */
export class FloatingHost implements DisplayHost {
  readonly root: HTMLDivElement;
  readonly viewport: HTMLDivElement;
  readonly dragHandle: HTMLDivElement;

  private readonly shell: HTMLDivElement;
  private readonly header: HTMLDivElement;
  private dragController: DragController | null = null;
  private mounted = false;

  /**
   * @param config - Resolved viewer configuration.
   */
  constructor(private readonly config: ResolvedTelemetryFlightViewerConfig) {
    const { floating } = config;

    this.root = createViewerRoot(MODE_CLASS, config.className);
    this.root.style.zIndex = String(floating.zIndex);

    this.shell = document.createElement("div");
    this.shell.className = "tfv-floating";
    this.shell.setAttribute("role", "dialog");
    this.shell.setAttribute("aria-label", floating.title);

    this.header = document.createElement("div");
    this.header.className = "tfv-floating__header";
    this.header.textContent = floating.title;
    this.header.setAttribute("aria-grabbed", "false");

    this.viewport = createViewerViewport();

    this.shell.append(this.header, this.viewport);
    this.root.appendChild(this.shell);

    this.dragHandle = this.header;
    this.applyShellDimensions(floating.width, floating.height);
    this.applyAnchor(floating.position, floating.margin);
  }

  /**
   * Appends the overlay to the configured container (often `document.body`).
   */
  mount(): void {
    if (this.mounted) return;

    this.config.container.appendChild(this.root);

    if (this.config.floating.draggable) {
      this.dragController = new DragController({
        handle: this.header,
        target: this.shell,
        margin: this.config.floating.margin,
        enabled: true
      });
    }

    this.mounted = true;
  }

  /**
   * Updates floating panel dimensions.
   */
  applyDimensions(
    width: DimensionValue = this.config.floating.width,
    height: DimensionValue = this.config.floating.height
  ): void {
    const w = width === "auto" ? this.config.floating.width : width;
    const h = height === "auto" ? this.config.floating.height : height;
    this.applyShellDimensions(w, h);
  }

  /**
   * Disposes drag handlers and removes the overlay from the DOM.
   */
  dispose(): void {
    this.dragController?.dispose();
    this.dragController = null;
    this.root.remove();
    this.mounted = false;
  }

  private applyShellDimensions(width: number, height: number): void {
    this.shell.style.width = `${width}px`;
    this.shell.style.height = `${height}px`;
  }

  private applyAnchor(position: FloatingPosition, margin: number): void {
    this.shell.style.position = "fixed";
    const m = `${margin}px`;

    this.shell.style.top = "";
    this.shell.style.left = "";
    this.shell.style.right = "";
    this.shell.style.bottom = "";
    this.shell.style.transform = "";

    switch (position) {
      case "top-left":
        this.shell.style.top = m;
        this.shell.style.left = m;
        break;
      case "top-right":
        this.shell.style.top = m;
        this.shell.style.right = m;
        break;
      case "bottom-left":
        this.shell.style.bottom = m;
        this.shell.style.left = m;
        break;
      case "center":
        this.shell.style.top = "50%";
        this.shell.style.left = "50%";
        this.shell.style.transform = "translate(-50%, -50%)";
        break;
      case "bottom-right":
      default:
        this.shell.style.bottom = m;
        this.shell.style.right = m;
        break;
    }
  }
}
