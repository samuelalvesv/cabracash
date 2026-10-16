import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import ThemeRegistry from "@/theme/ThemeRegistry";
import { useColorMode } from "@/shared/hooks/useColorMode";

function ModeConsumer() {
  const { mode } = useColorMode();
  return <span data-testid="current-mode">{mode}</span>;
}

function ToggleConsumer() {
  const { mode, toggleColorMode } = useColorMode();
  return (
    <button type="button" onClick={toggleColorMode}>
      toggle-{mode}
    </button>
  );
}

describe("ThemeRegistry", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("lê o tema armazenado no localStorage", async () => {
    window.localStorage.setItem("app-color-mode", "dark");

    render(
      <ThemeRegistry>
        <ModeConsumer />
      </ThemeRegistry>,
    );

    await waitFor(() => expect(screen.getByTestId("current-mode")).toHaveTextContent("dark"));
  });

  it("persiste a alteração de tema ao alternar", () => {
    render(
      <ThemeRegistry>
        <ToggleConsumer />
      </ThemeRegistry>,
    );

    fireEvent.click(screen.getByRole("button", { name: /toggle-light/i }));

    expect(window.localStorage.getItem("app-color-mode")).toBe("dark");
    expect(screen.getByRole("button", { name: /toggle-dark/i })).toBeInTheDocument();
  });
});
