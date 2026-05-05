export type PickAndRenameStrict<
  T,
  K extends keyof T,
  M extends Record<K, string>,
> = {
  [P in K as M[P]]: T[P];
};
