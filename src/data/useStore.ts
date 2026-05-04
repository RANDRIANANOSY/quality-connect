import { useEffect, useState } from "react";
import { subscribe } from "@/data/store";

/** Re-renders the component whenever the global store changes. */
export function useStore() {
  const [, set] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => set((n) => n + 1));
    return () => {
      unsub();
    };
  }, []);
}
