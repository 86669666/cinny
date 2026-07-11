import { MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';

export type Pan = {
  translateX: number;
  translateY: number;
};

const INITIAL_PAN = {
  translateX: 0,
  translateY: 0,
};

export const usePan = (active: boolean) => {
  const [pan, setPan] = useState<Pan>(INITIAL_PAN);
  const [cursor, setCursor] = useState<'grab' | 'grabbing' | 'initial'>(
    active ? 'grab' : 'initial'
  );
  const panRef = useRef(pan);
  panRef.current = pan;

  useEffect(() => {
    setCursor(active ? 'grab' : 'initial');
  }, [active]);

  // Guard: cleanup on unmount even if mouseup didn't fire
  useEffect(() => () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((evt: MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    setPan((p) => ({
      translateX: p.translateX + evt.movementX,
      translateY: p.translateY + evt.movementY,
    }));
  }, []);

  const handleMouseUp = useCallback((evt: MouseEvent) => {
    evt.preventDefault();
    setCursor('grab');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown: MouseEventHandler<HTMLElement> = (evt) => {
    if (!active) return;
    evt.preventDefault();
    setCursor('grabbing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!active) setPan(INITIAL_PAN);
  }, [active]);

  return {
    pan,
    cursor,
    onMouseDown: handleMouseDown,
  };
};
