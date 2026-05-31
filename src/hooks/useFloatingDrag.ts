import { RefObject, useEffect } from "react";

interface Options {
  enabled: boolean;
  shellRef: RefObject<HTMLElement | null>;
  handleRef: RefObject<HTMLElement | null>;
  margin: number;
}

export function useFloatingDrag({ enabled, shellRef, handleRef, margin }: Options) {
  useEffect(() => {
    if (!enabled) return;

    const shell = shellRef.current;
    const handle = handleRef.current;
    if (!shell || !handle) return;

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      dragging = true;
      handle.setAttribute("aria-grabbed", "true");
      const rect = shell.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      shell.style.transform = "none";
      shell.style.left = `${rect.left}px`;
      shell.style.top = `${rect.top}px`;
      shell.style.right = "auto";
      shell.style.bottom = "auto";
      event.preventDefault();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!dragging) return;
      const maxLeft = window.innerWidth - shell.offsetWidth - margin;
      const maxTop = window.innerHeight - shell.offsetHeight - margin;
      const left = Math.min(Math.max(margin, event.clientX - offsetX), maxLeft);
      const top = Math.min(Math.max(margin, event.clientY - offsetY), maxTop);
      shell.style.left = `${left}px`;
      shell.style.top = `${top}px`;
    };

    const onMouseUp = () => {
      dragging = false;
      handle.setAttribute("aria-grabbed", "false");
    };

    handle.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [enabled, margin, shellRef, handleRef]);
}
