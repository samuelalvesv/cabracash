"use client";

import React, { createContext, useCallback, useMemo, useSyncExternalStore } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, GlobalStyles } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import type { PropsWithChildren } from "react";

import { createAppTheme } from "@/theme/createAppTheme";

interface ColorModeContextValue {
  mode: PaletteMode;
  toggleColorMode: () => void;
  setMode: (mode: PaletteMode) => void;
}

export const ColorModeContext = createContext<ColorModeContextValue | null>(null);

const STORAGE_KEY = "app-color-mode";

const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  window.addEventListener("storage", callback);

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const mediaListener = () => callback();
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", mediaListener);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(mediaListener);
  }

  return () => {
    subscribers.delete(callback);
    window.removeEventListener("storage", callback);
    if (typeof mediaQuery.removeEventListener === "function") {
      mediaQuery.removeEventListener("change", mediaListener);
    } else if (typeof mediaQuery.removeListener === "function") {
      mediaQuery.removeListener(mediaListener);
    }
  };
}

function getSnapshot(): PaletteMode {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY) as PaletteMode | null;
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): PaletteMode {
  return "light";
}

export function ThemeRegistry({ children }: PropsWithChildren) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((nextMode: PaletteMode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
      notifySubscribers();
    }
  }, []);

  const toggleColorMode = useCallback(() => {
    const nextMode = mode === "light" ? "dark" : "light";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
      notifySubscribers();
    }
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggleColorMode,
      setMode,
    }),
    [mode, toggleColorMode, setMode],
  );

  return (
    <AppRouterCacheProvider>
      <ColorModeContext.Provider value={contextValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalStyles
            styles={{
              body: {
                backgroundColor: theme.palette.background.default,
              },
            }}
          />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}

export default ThemeRegistry;
