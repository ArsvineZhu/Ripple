import { createContext, useContext, useState } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
const OverlayContext = createContext<{
  container: HTMLDivElement | null;
  setContainer: (element: HTMLDivElement | null) => void;
  openId: string | null;
  setOpenId: Dispatch<SetStateAction<string | null>>;
} | null>(null);
export function OverlayProvider({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <OverlayContext.Provider value={{ container, setContainer, openId, setOpenId }}>
      {children}
    </OverlayContext.Provider>
  );
}
export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error('OverlayProvider is missing');
  return context;
}
