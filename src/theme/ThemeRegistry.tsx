"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CssBaseline, GlobalStyles, useMediaQuery } from "@mui/material";
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

export function ThemeRegistry({ children }: PropsWithChildren) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", { ssrMatchMedia: () => ({ matches: false }) });
  const [mode, setModeState] = useState<PaletteMode>("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (window.localStorage.getItem(STORAGE_KEY) as PaletteMode | null) : null;
    if (stored === "light" || stored === "dark") {
      setModeState(stored);
    } else {
      setModeState(prefersDarkMode ? "dark" : "light");
    }
  }, [prefersDarkMode]);

  const setMode = useCallback((nextMode: PaletteMode) => {
    setModeState(nextMode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    }
  }, []);

  const toggleColorMode = useCallback(() => {
    setModeState((prev) => {
      const nextMode = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, nextMode);
      }
      return nextMode;
    });
  }, []);

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
