import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PickAndRenameStrict<
  T,
  K extends keyof T,
  M extends Record<K, string>,
> = {
  [P in K as M[P]]: T[P];
};
