import { useEffect, useRef, useState } from 'react';

export type PopupKey = string | null;

export function usePopupController<T extends PopupKey>() {
  const [activePopup, setActivePopup] = useState<T>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggle = (key: T) => {
    setActivePopup((prev) => (prev === key ? null : key));
  };

  const close = () => setActivePopup(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return {
    activePopup,
    toggle,
    close,
    containerRef,
  };
}
