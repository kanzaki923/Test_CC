import { renderHook, act } from '@testing-library/react';
import { useToastStore } from './toastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useToastStore.setState({ toasts: [] });
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'Test message',
        type: 'success',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('should add multiple toasts', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'First toast',
        type: 'success',
      });
      result.current.addToast({
        message: 'Second toast',
        type: 'error',
      });
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].message).toBe('First toast');
    expect(result.current.toasts[1].message).toBe('Second toast');
  });

  it('should remove a toast by id', () => {
    const { result } = renderHook(() => useToastStore());

    let toastId: string;

    act(() => {
      toastId = result.current.addToast({
        message: 'Test message',
        type: 'success',
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should remove correct toast when multiple toasts exist', () => {
    const { result } = renderHook(() => useToastStore());

    let firstId: string;
    let secondId: string;

    act(() => {
      firstId = result.current.addToast({
        message: 'First toast',
        type: 'success',
      });
      secondId = result.current.addToast({
        message: 'Second toast',
        type: 'error',
      });
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.removeToast(firstId);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(secondId);
    expect(result.current.toasts[0].message).toBe('Second toast');
  });

  it('should clear all toasts', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'First toast',
        type: 'success',
      });
      result.current.addToast({
        message: 'Second toast',
        type: 'error',
      });
      result.current.addToast({
        message: 'Third toast',
        type: 'info',
      });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clearToasts();
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should support different toast types', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({ message: 'Success', type: 'success' });
      result.current.addToast({ message: 'Error', type: 'error' });
      result.current.addToast({ message: 'Warning', type: 'warning' });
      result.current.addToast({ message: 'Info', type: 'info' });
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('warning');
    expect(result.current.toasts[3].type).toBe('info');
  });

  it('should set default type to "info" if not specified', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({ message: 'Default toast' });
    });

    expect(result.current.toasts[0].type).toBe('info');
  });

  it('should generate unique ids for each toast', () => {
    const { result } = renderHook(() => useToastStore());

    let firstId: string;
    let secondId: string;

    act(() => {
      firstId = result.current.addToast({ message: 'First' });
      secondId = result.current.addToast({ message: 'Second' });
    });

    expect(firstId).not.toBe(secondId);
  });

  it('should support custom duration', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'Custom duration',
        type: 'success',
        duration: 5000,
      });
    });

    expect(result.current.toasts[0].duration).toBe(5000);
  });

  it('should use default duration when not specified', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({
        message: 'Default duration',
        type: 'success',
      });
    });

    // Default duration should be 3000ms
    expect(result.current.toasts[0].duration).toBe(3000);
  });

  it('should return toast id when adding', () => {
    const { result } = renderHook(() => useToastStore());

    let id: string;

    act(() => {
      id = result.current.addToast({ message: 'Test' });
    });

    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(result.current.toasts[0].id).toBe(id);
  });

  it('should handle removing non-existent toast gracefully', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.addToast({ message: 'Test' });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.removeToast('non-existent-id');
    });

    // Should still have 1 toast
    expect(result.current.toasts).toHaveLength(1);
  });
});
