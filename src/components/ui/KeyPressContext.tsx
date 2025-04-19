import React, { createContext, useContext, useEffect, useState } from 'react';

const KeyContext = createContext<Set<string>>(new Set());

export const KeyPressProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [pressed, setPressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setPressed((prev) => {
        const next = new Set(prev);
        next.add(e.key.toLowerCase());
        return next;
      });
    };
    const up = (e: KeyboardEvent) => {
      setPressed((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };
    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('keyup', up);
    };
  }, []);

  return <KeyContext.Provider value={pressed}>{children}</KeyContext.Provider>;
};

export function usePressedKeys() {
  return useContext(KeyContext);
}
