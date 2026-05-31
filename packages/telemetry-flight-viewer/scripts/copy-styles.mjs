import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const src = join(root, "src", "ui", "overlay.css");
const destDir = join(root, "dist");
const dest = join(destDir, "styles.css");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
