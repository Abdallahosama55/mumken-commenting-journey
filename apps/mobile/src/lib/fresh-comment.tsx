import { createContext, use, useEffect, useState, type ReactNode } from 'react';

const HIGHLIGHT_MS = 3000;

/**
 * The id of the comment the user just posted, shared across screens: a reply is written on the reply
 * screen but highlighted on the discussion screen after navigating back. The highlight fades on its own.
 */
const FreshCommentContext = createContext<readonly [string | null, (id: string | null) => void]>([null, () => {}]);

export function FreshCommentProvider({ children }: { children: ReactNode }) {
  const [freshId, setFreshId] = useState<string | null>(null);

  useEffect(() => {
    if (!freshId) return;
    const timer = setTimeout(() => setFreshId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [freshId]);

  return <FreshCommentContext value={[freshId, setFreshId]}>{children}</FreshCommentContext>;
}

export const useFreshComment = () => use(FreshCommentContext);
