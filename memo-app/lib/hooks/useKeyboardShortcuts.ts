import { useEffect } from 'react';

/**
 * Keyboard shortcuts configuration
 * Key format: 'mod+key' where 'mod' is Ctrl on Windows/Linux and Cmd on Mac
 * Examples: 'mod+n', 'mod+k', 'escape', 'ctrl+s'
 */
export type ShortcutKey = string;
export type ShortcutHandler = (event: KeyboardEvent) => void;
export type ShortcutMap = Record<ShortcutKey, ShortcutHandler>;

export interface UseKeyboardShortcutsOptions {
  /**
   * Prevent default browser behavior for registered shortcuts
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Ignore shortcuts when typing in input fields (input, textarea, contenteditable)
   * @default true
   */
  ignoreInputFields?: boolean;
}

/**
 * Custom hook for registering keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'mod+n': () => createNewMemo(),
 *   'mod+k': () => focusSearch(),
 *   'mod+s': () => saveCurrentMemo(),
 *   'escape': () => closeModal(),
 * });
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    preventDefault = true,
    ignoreInputFields = true,
  } = options;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we should ignore this event (typing in input field)
      if (ignoreInputFields && isInputElement(event.target)) {
        return;
      }

      // Check each registered shortcut
      for (const [shortcut, handler] of Object.entries(shortcuts)) {
        if (matchesShortcut(event, shortcut)) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler(event);
          break; // Only trigger the first matching shortcut
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, preventDefault, ignoreInputFields]);
}

/**
 * Check if the event target is an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  const isContentEditable = target.isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isContentEditable
  );
}

/**
 * Check if a keyboard event matches a shortcut string
 *
 * Shortcut format examples:
 * - 'mod+n' - Ctrl+N on Windows/Linux, Cmd+N on Mac
 * - 'ctrl+s' - Ctrl+S on all platforms
 * - 'escape' - Escape key
 * - 'shift+delete' - Shift+Delete
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  // Check if the key matches
  const eventKey = event.key.toLowerCase();
  if (eventKey !== key) {
    return false;
  }

  // Check modifiers
  for (const modifier of modifiers) {
    switch (modifier) {
      case 'mod':
        // 'mod' means Ctrl on Windows/Linux, Cmd (Meta) on Mac
        const isMacMod = event.metaKey;
        const isWinLinuxMod = event.ctrlKey;
        if (!isMacMod && !isWinLinuxMod) {
          return false;
        }
        break;
      case 'ctrl':
        if (!event.ctrlKey) return false;
        break;
      case 'alt':
        if (!event.altKey) return false;
        break;
      case 'shift':
        if (!event.shiftKey) return false;
        break;
      case 'meta':
      case 'cmd':
        if (!event.metaKey) return false;
        break;
    }
  }

  // If no modifiers required, check that no modifiers are pressed
  if (modifiers.length === 0) {
    // For keys like 'escape', we don't want any modifiers
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return false;
    }
  }

  return true;
}
