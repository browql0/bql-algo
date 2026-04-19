import { useState, useRef, useEffect } from 'react';

export const useEditorResize = () => {
  const [splitRatio, setSplitRatio] = useState(52);
  const isDraggingRef = useRef(false);
  const resizerRef = useRef(null);
  const workspaceRef = useRef(null);

  useEffect(() => {
    const onMove = (clientX) => {
      if (!isDraggingRef.current || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const ratio = ((clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(ratio, 25), 75));
    };
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      resizerRef.current?.classList.remove('is-dragging');
    };
    const onMouseMove = (e) => onMove(e.clientX);
    const onTouchMove = (e) => onMove(e.touches[0].clientX);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const handleResizerMouseDown = (event) => {
    event.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    resizerRef.current?.classList.add('is-dragging');
  };

  return { splitRatio, resizerRef, workspaceRef, handleResizerMouseDown };
};
