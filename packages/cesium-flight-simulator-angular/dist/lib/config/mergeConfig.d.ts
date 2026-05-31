type AnyObject = Record<string, any>;
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends AnyObject ? DeepPartial<T[K]> : T[K];
};
export declare function deepMerge<T extends AnyObject>(base: T, override?: DeepPartial<T>): T;
export {};
