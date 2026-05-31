type AnyObject = Record<string, any>;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends AnyObject ? DeepPartial<T[K]> : T[K];
};

export function deepMerge<T extends AnyObject>(base: T, override?: DeepPartial<T>): T {
  if (!override) return base;

  const result: AnyObject = { ...base };

  Object.entries(override).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof result[key] === "object" &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key], value as AnyObject);
    } else if (value !== undefined) {
      result[key] = value;
    }
  });

  return result as T;
}
