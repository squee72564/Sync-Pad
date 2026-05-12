export type PickAndRenameStrict<
  T,
  K extends keyof T,
  M extends Record<K, string>,
> = {
  [P in K as M[P]]: T[P];
};

export type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K;
}[keyof T];
export type RequiredFields<T> = Pick<T, RequiredKeys<T>>;
