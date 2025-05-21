import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (typeof objA !== 'object' || typeof objB !== 'object') {
    return objA === objB;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (objA[key as keyof typeof objA] !== objB[key as keyof typeof objB]) {
      return false;
    }
  }

  return true;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  const seen = new WeakMap<object, object>();
  function inner(a: unknown, b: unknown): boolean {
    // primitive / reference
    if (a === b) return true;
    if (a == null || b == null || typeof a !== "object" || typeof b !== "object") return false;

    if (seen.get(a as object) === b) return true;
    seen.set(a as object, b as object);

    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

    // Handle built-ins that need value-level equality
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp && b instanceof RegExp)
      return a.source === b.source && a.flags === b.flags;
    if (a instanceof Map && b instanceof Map)
      return a.size === b.size && [...a.entries()].every(([k, v]) => b.has(k) && inner(v, b.get(k)));
    if (a instanceof Set && b instanceof Set)
      return a.size === b.size && [...a].every(v => b.has(v));

    const keysA = Reflect.ownKeys(a as object);
    const keysB = Reflect.ownKeys(b as object);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key =>
      keysB.includes(key) &&
      inner(
        (a as Record<PropertyKey, unknown>)[key],
        (b as Record<PropertyKey, unknown>)[key]
      )
    );
  }

  return inner(obj1, obj2);
}
