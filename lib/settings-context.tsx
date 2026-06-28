"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "clash-logic-builder-count";
const DEFAULT_BUILDER_COUNT = 5;
const MIN_BUILDERS = 1;
const MAX_BUILDERS = 6;

interface SettingsContextValue {
  builderCount: number;
  setBuilderCount: (count: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function clampBuilderCount(value: number): number {
  return Math.min(MAX_BUILDERS, Math.max(MIN_BUILDERS, Math.round(value)));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [builderCount, setBuilderCountState] = useState(DEFAULT_BUILDER_COUNT);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setBuilderCountState(clampBuilderCount(parsed));
      }
    }
  }, []);

  const setBuilderCount = useCallback((count: number) => {
    const clamped = clampBuilderCount(count);
    setBuilderCountState(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  return (
    <SettingsContext.Provider value={{ builderCount, setBuilderCount }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}

export {
  DEFAULT_BUILDER_COUNT,
  MIN_BUILDERS,
  MAX_BUILDERS,
};
