import { useCallback, useEffect } from 'react';

interface IsComposingLike {
  readonly timeStamp: number;
  readonly keyCode: number;
  readonly nativeEvent: {
    readonly isComposing?: boolean;
  };
}

// Module-level refs — synchronous reads/writes, no React render delay.
// One editor on screen at a time, so shared state is correct.
let _isComposing = false;
let _compositionEndTime = 0;

/**
 * Track composition start/end synchronously at module level.
 * Call once at app root so `useComposingCheck` can read the refs.
 */
export function useCompositionEndTracking(): void {
  useEffect(() => {
    const onStart = () => {
      _isComposing = true;
    };
    const onEnd = (e: CompositionEvent) => {
      _isComposing = false;
      _compositionEndTime = e.timeStamp;
    };

    window.addEventListener('compositionstart', onStart, { capture: true });
    window.addEventListener('compositionend', onEnd, { capture: true });
    return () => {
      window.removeEventListener('compositionstart', onStart, { capture: true });
      window.removeEventListener('compositionend', onEnd, { capture: true });
    };
  }, []);
}

export function useComposingCheck(): (evt: IsComposingLike) => boolean {
  return useCallback((evt: IsComposingLike): boolean => {
    // Standard — most IME keystrokes carry this flag during composition.
    if (evt.nativeEvent.isComposing) return true;

    // Module-level ref — synchronous, no Jotai/React render delay.
    if (_isComposing) return true;

    // Grace period after compositionend.
    // On macOS CJK IMEs, compositionend fires immediately before the
    // committing keydown (Enter, keyCode=13, isComposing=false).
    // The ref was set synchronously in the 'compositionend' listener,
    // so _compositionEndTime is already current when keydown fires.
    if (
      _compositionEndTime > 0 &&
      evt.timeStamp - _compositionEndTime <= 500
    ) {
      return true;
    }

    return false;
  }, []);
}
