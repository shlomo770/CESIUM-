/**
 * @module utils/dispose
 * @description Recursive disposal utilities for Three.js GPU resources.
 *
 * Prevents WebGL memory leaks when tearing down scenes, loaders, or individual
 * meshes. Safe to call multiple times on the same object graph if nodes were
 * already removed from the scene.
 */

import type {
  BufferGeometry,
  Material,
  Object3D,
  Texture
} from "three";

/** Known texture-bearing property keys commonly found on Three.js materials. */
const MATERIAL_TEXTURE_KEYS = [
  "map",
  "alphaMap",
  "aoMap",
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "specularMap",
  "gradientMap",
  "matcap",
  "clearcoatMap",
  "clearcoatNormalMap",
  "clearcoatRoughnessMap",
  "iridescenceMap",
  "iridescenceThicknessMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "thicknessMap",
  "transmissionMap"
] as const;

/**
 * Object3D-like node that may carry renderable GPU resources.
 */
interface DisposableObject3D extends Object3D {
  geometry?: BufferGeometry;
  material?: Material | Material[];
}

/**
 * Disposes all GPU resources attached to an {@link Object3D} subtree.
 *
 * @param root - Root object to traverse (typically a Scene or Group).
 */
export function disposeObject3D(root: Object3D): void {
  if (!root) return;

  root.traverse((node: Object3D) => {
    disposeNodeResources(node as DisposableObject3D);
  });
}

/**
 * Disposes geometries, materials, and textures for a single object node.
 *
 * @param node - Object3D that may own a geometry and/or material(s).
 */
export function disposeNodeResources(node: DisposableObject3D): void {
  disposeGeometry(node.geometry);
  disposeMaterialOrArray(node.material);
}

/**
 * Disposes a single material and all texture properties attached to it.
 *
 * @param material - Three.js material instance.
 */
export function disposeMaterial(material: Material): void {
  if (!material) return;

  disposeMaterialTextures(material);

  if (typeof material.dispose === "function") {
    material.dispose();
  }
}

/**
 * Disposes a standalone texture if it has not already been destroyed.
 *
 * @param texture - Three.js texture instance.
 */
export function disposeTexture(texture: Texture | null | undefined): void {
  if (!texture) return;

  if (typeof texture.dispose === "function") {
    texture.dispose();
  }
}

/**
 * Disposes an array of materials or a single material reference.
 *
 * @param material - Material or array of materials.
 */
export function disposeMaterialOrArray(
  material: Material | Material[] | undefined
): void {
  if (!material) return;

  if (Array.isArray(material)) {
    for (const entry of material) {
      disposeMaterial(entry);
    }
    return;
  }

  disposeMaterial(material);
}

/**
 * Disposes buffer geometry when present.
 *
 * @param geometry - BufferGeometry instance.
 */
export function disposeGeometry(
  geometry: BufferGeometry | undefined
): void {
  if (!geometry) return;

  if (typeof geometry.dispose === "function") {
    geometry.dispose();
  }
}

/**
 * Walks known texture slots on a material and disposes each texture.
 *
 * @param material - Target material.
 */
export function disposeMaterialTextures(material: Material): void {
  const record = material as unknown as Record<string, unknown>;

  for (const key of MATERIAL_TEXTURE_KEYS) {
    const value = record[key];
    if (isTexture(value)) {
      disposeTexture(value);
    }
  }

  // Fallback: dispose any additional texture-like properties.
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (isTexture(value)) {
      disposeTexture(value);
    }
  }
}

/**
 * Clears material and geometry references on a node after disposal.
 * Helps the garbage collector release JS-side references sooner.
 *
 * @param node - Object3D to detach resources from.
 */
export function detachNodeResources(node: DisposableObject3D): void {
  disposeNodeResources(node);
  node.geometry = undefined;
  node.material = undefined;
}

function isTexture(value: unknown): value is Texture {
  return (
    value !== null &&
    typeof value === "object" &&
    "isTexture" in value &&
    (value as Texture).isTexture === true
  );
}
