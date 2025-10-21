/**
 * Generate a unique ID
 * Uses timestamp and random string for uniqueness
 *
 * @param prefix - Optional prefix for the ID (e.g., 'memo', 'category', 'toast')
 * @returns A unique ID string
 *
 * @example
 * ```ts
 * generateId() // "1234567890-abc123"
 * generateId('memo') // "memo-1234567890-abc123"
 * ```
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const id = `${timestamp}-${randomStr}`;

  return prefix ? `${prefix}-${id}` : id;
}
