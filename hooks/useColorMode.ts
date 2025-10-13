import { useContext } from "react";

import { ColorModeContext } from "@/components/ThemeRegistry";

export function useColorMode() {
  const context = useContext(ColorModeContext);

  if (!context) {
    throw new Error("useColorMode must be used within ThemeRegistry");
  }

  return context;
}

export default useColorMode;
