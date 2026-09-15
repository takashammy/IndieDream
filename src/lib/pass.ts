/** Server-side password hashing. Never import hashing from client code. */

export function passwordTooWeak(value: string) {
  return value.trim().length < 8;
}
