"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { LocalStorageAdapter } from "./LocalStorageAdapter";
import type { StorageAdapter } from "./StorageAdapter";

const StorageCtx = createContext<StorageAdapter | null>(null);

export function StorageProvider({
  children,
  adapter: injectedAdapter,
}: {
  children: ReactNode;
  /** Override the default LocalStorageAdapter. Intended for tests only. */
  adapter?: StorageAdapter;
}) {
  const [defaultAdapter] = useState<StorageAdapter>(() => new LocalStorageAdapter());
  const resolved = injectedAdapter ?? defaultAdapter;
  return <StorageCtx.Provider value={resolved}>{children}</StorageCtx.Provider>;
}

export function useStorage(): StorageAdapter {
  const ctx = useContext(StorageCtx);
  if (!ctx) throw new Error("useStorage must be called inside <StorageProvider>");
  return ctx;
}
