import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Header from "@/components/ui/Header";

const usePathnameMock = vi.hoisted(() => vi.fn());
const useColorModeMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/shared/hooks/useColorMode", () => ({
  useColorMode: useColorModeMock,
}));

function renderHeader() {
  render(
    <ThemeProvider theme={createTheme()}>
      <Header />
    </ThemeProvider>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    usePathnameMock.mockReturnValue("/");
    useColorModeMock.mockReturnValue({
      mode: "light",
      toggleColorMode: vi.fn(),
      setMode: vi.fn(),
    });
  });

  it("dispara o toggle de tema ao clicar no botão correspondente", () => {
    const toggleMock = vi.fn();
    useColorModeMock.mockReturnValue({
      mode: "light",
      toggleColorMode: toggleMock,
      setMode: vi.fn(),
    });

    renderHeader();

    fireEvent.click(screen.getByLabelText(/Alternar tema/i));
    expect(toggleMock).toHaveBeenCalledTimes(1);
  });

  it("abre o menu mobile ao clicar no botão de menu", async () => {
    renderHeader();

    const [menuButton] = screen.getAllByLabelText(/Abrir menu/i);
    fireEvent.click(menuButton);

    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Ranking/i })).toBeVisible());
    await waitFor(() => expect(screen.getByRole("menuitem", { name: /Sobre/i })).toBeVisible());

    fireEvent.keyDown(document.body, { key: "Escape" });
  });

  it("marca a rota atual como ativa", () => {
    usePathnameMock.mockReturnValue("/about");
    renderHeader();

    const aboutButton = screen.getByRole("link", { name: /Sobre/i });
    const rankingButton = screen.getByRole("link", { name: /Ranking/i });

    expect(aboutButton.className).toMatch(/MuiButton-colorPrimary/);
    expect(rankingButton.className).not.toMatch(/MuiButton-colorPrimary/);
  });
});
