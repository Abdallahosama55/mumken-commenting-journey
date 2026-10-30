'use client';

import { createContext, use, useCallback, useRef, useState, type ReactNode } from 'react';

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce>(() => {});

/**
 * One polite live region for the app (A-2). Mounted once, before any message, so screen readers register
 * it; clearing first makes a repeated identical message ("Your comment was posted.") announce again.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const announce = useCallback<Announce>((next) => {
    setMessage('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(next), 50);
  }, []);

  return (
    <AnnouncerContext value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {message}
      </div>
    </AnnouncerContext>
  );
}

export const useAnnounce = () => use(AnnouncerContext);
