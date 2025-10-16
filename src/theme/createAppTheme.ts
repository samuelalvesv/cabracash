import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

const commonSettings = {
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ["Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"].join(", "),
  },
};

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#90caf9" : "#1976d2",
      },
      secondary: {
        main: mode === "dark" ? "#ce93d8" : "#9c27b0",
      },
      background: {
        default: mode === "dark" ? "#0f172a" : "#f9fafb",
        paper: mode === "dark" ? "#111827" : "#ffffff",
      },
    },
    ...commonSettings,
  });
}
