import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should register keyboard event listener on mount', () => {
    const shortcuts = {};
    renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should remove event listener on unmount', () => {
    const shortcuts = {};
    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should call handler when Ctrl+N is pressed', () => {
    const handleNew = jest.fn();
    const shortcuts = {
      'ctrl+n': handleNew,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
    });
    window.dispatchEvent(event);

    expect(handleNew).toHaveBeenCalledTimes(1);
  });

  it('should call handler when Meta+N (Cmd on Mac) is pressed', () => {
    const handleNew = jest.fn();
    const shortcuts = {
      'mod+n': handleNew, // 'mod' means Ctrl on Windows/Linux, Cmd on Mac
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      metaKey: true,
    });
    window.dispatchEvent(event);

    expect(handleNew).toHaveBeenCalledTimes(1);
  });

  it('should call handler when Escape is pressed', () => {
    const handleEscape = jest.fn();
    const shortcuts = {
      escape: handleEscape,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
    });
    window.dispatchEvent(event);

    expect(handleEscape).toHaveBeenCalledTimes(1);
  });

  it('should prevent default behavior when preventDefault is true', () => {
    const handleSave = jest.fn();
    const shortcuts = {
      'mod+s': handleSave,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts, { preventDefault: true }));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it('should not trigger shortcuts when typing in input field', () => {
    const handleNew = jest.fn();
    const shortcuts = {
      'mod+n': handleNew,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts, { ignoreInputFields: true }));

    // Create a fake input element
    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    window.dispatchEvent(event);

    expect(handleNew).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not trigger shortcuts when typing in textarea', () => {
    const handleNew = jest.fn();
    const shortcuts = {
      'mod+n': handleNew,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts, { ignoreInputFields: true }));

    // Create a fake textarea element
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const event = new KeyboardEvent('keydown', {
      key: 'n',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });

    window.dispatchEvent(event);

    expect(handleNew).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should handle multiple shortcuts', () => {
    const handleNew = jest.fn();
    const handleSearch = jest.fn();
    const handleSave = jest.fn();

    const shortcuts = {
      'mod+n': handleNew,
      'mod+k': handleSearch,
      'mod+s': handleSave,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Test Ctrl+N
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
    expect(handleNew).toHaveBeenCalledTimes(1);

    // Test Ctrl+K
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(handleSearch).toHaveBeenCalledTimes(1);

    // Test Ctrl+S
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  it('should not call handler for unregistered shortcuts', () => {
    const handleNew = jest.fn();
    const shortcuts = {
      'mod+n': handleNew,
    };

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Press Ctrl+X (not registered)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true }));

    expect(handleNew).not.toHaveBeenCalled();
  });

  it('should update shortcuts when dependencies change', () => {
    const handleNew1 = jest.fn();
    const handleNew2 = jest.fn();

    const { rerender } = renderHook(
      ({ shortcuts }) => useKeyboardShortcuts(shortcuts),
      {
        initialProps: { shortcuts: { 'mod+n': handleNew1 } },
      }
    );

    // Test first handler
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
    expect(handleNew1).toHaveBeenCalledTimes(1);
    expect(handleNew2).not.toHaveBeenCalled();

    // Update shortcuts
    rerender({ shortcuts: { 'mod+n': handleNew2 } });

    // Test second handler
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', ctrlKey: true }));
    expect(handleNew1).toHaveBeenCalledTimes(1); // Still 1
    expect(handleNew2).toHaveBeenCalledTimes(1); // Now called
  });
});
