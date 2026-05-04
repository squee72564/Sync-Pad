export type JsonDate = string;

export type JsonPrimitive = string | number | boolean | null;

export type Jsonify<T> = T extends Date
  ? JsonDate
  : T extends bigint
    ? never
    : T extends JsonPrimitive | undefined
      ? T
      : T extends (infer Item)[]
        ? Jsonify<Item>[]
        : T extends readonly (infer Item)[]
          ? readonly Jsonify<Item>[]
          : T extends object
            ? { [Key in keyof T]: Jsonify<T[Key]> }
            : T;
